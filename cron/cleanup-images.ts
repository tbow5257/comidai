import { fileURLToPath } from 'url';
import Client from '@replit/database';
import { Client as StorageClient } from '@replit/object-storage';

const kvClient = new Client();
const storageClient = new StorageClient();

const RETENTION_PERIOD = 5 * 60 * 1000; // 5 minutes

async function cleanupOldImages(dryRun = false) {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting cleanup${dryRun ? ' (DRY RUN)' : ''}`);

  const stats = {
    scanned: 0,
    deleted: 0,
    errors: [] as string[],
    startTime: startTime.toISOString(),
    endTime: '',
    dryRun
  };

  try {
    const keys = await kvClient.list('analysis:');
    const imageKeys = keys?.value?.filter(key => key.endsWith(':image')) ?? []
    if (!imageKeys) {
        stats.endTime = new Date().toISOString();
        await kvClient.set('cleanup:lastRun', stats);
        console.log("No images found to clean up.");
        return stats;
    }
    console.log(`Found ${imageKeys.length} image references to check`);

    const now = new Date().getTime();

    for (const key of imageKeys) {
      stats.scanned++;
      const imageData = await kvClient.get(key);
      
      if (!imageData) {
        console.log(`No data found for key: ${key}`);
        continue;
      }

      const { name, createdAt } = imageData.value;
      const imageAge = now - new Date(createdAt).getTime();

      console.log(`Checking image ${name}, age: ${imageAge}ms`);

      if (imageAge > RETENTION_PERIOD) {
        if (!dryRun) {
          try {
            const deleteResult = await storageClient.delete(name);
            if (deleteResult.ok) {
              console.log(`Deleted old image: ${name}`);
              await kvClient.delete(key);
              stats.deleted++;
            } else {
              const error = `Failed to delete image ${name}: ${deleteResult.error}`;
              console.error(error);
              stats.errors.push(error);
            }
          } catch (error: any) {
            const errorMsg = `Error deleting ${name}: ${error?.message}`;
            console.error(errorMsg);
            stats.errors.push(errorMsg);
          }
        } else {
          console.log(`Would delete: ${name} (dry run)`);
          stats.deleted++;
        }
      }
    }
  } catch (error: any) {
    const errorMsg = `Cleanup error: ${error?.message}`;
    console.error(errorMsg);
    stats.errors.push(errorMsg);
  }

  stats.endTime = new Date().toISOString();
  
  // Store run statistics
  await kvClient.set('cleanup:lastRun', stats);
  
  console.log('Cleanup completed. Stats:', JSON.stringify(stats, null, 2));
  return stats;
}

const isFileBeingRunDirectly = import.meta.url === `file://${fileURLToPath(import.meta.url)}`
// Command line arguments handling
if (isFileBeingRunDirectly) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  cleanupOldImages(dryRun)
    .then(stats => {
      if (stats?.errors?.length > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal cleanup error:', error);
      process.exit(1);
    });
}

export { cleanupOldImages };
