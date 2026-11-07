import { cleanOldReceiptImages } from "../lib/receipts";

async function main() {
  const argDays = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
  const days = isNaN(argDays) || argDays < 1 ? 10 : argDays;

  console.log(`[Receipt Cleanup] Scanning storage/receipts for images older than ${days} days...`);
  const result = await cleanOldReceiptImages(days);
  console.log(`[Receipt Cleanup] Done! Scanned: ${result.scanned} files, Deleted: ${result.deleted} file(s).`);
}

main().catch((err) => {
  console.error("[Receipt Cleanup] Error:", err);
  process.exit(1);
});
