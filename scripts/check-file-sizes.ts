import fs from 'fs';
import path from 'path';

interface FileMetric {
  filePath: string;
  relativePath: string;
  lines: number;
  bytes: number;
  category: string;
}

const THRESHOLD_LINES = 1000;

function categorizeFile(relPath: string): string {
  if (relPath.startsWith('src/hooks/')) return 'State & Hooks';
  if (relPath.startsWith('src/pages/')) return 'Pages & Views';
  if (relPath.startsWith('src/components/admin/')) return 'Admin Components';
  if (relPath.startsWith('src/components/provider/')) return 'Provider Components';
  if (relPath.startsWith('src/components/modals/')) return 'Modals & Steppers';
  if (relPath.startsWith('src/components/common/')) return 'Common UI';
  if (relPath.startsWith('src/components/')) return 'General Components';
  if (relPath.startsWith('src/modules/')) return 'Backend Modules & Controllers';
  if (relPath.startsWith('src/models/')) return 'Database Models';
  if (relPath.startsWith('src/data/')) return 'Data & Constants';
  if (relPath.startsWith('src/utils/')) return 'Utilities';
  if (relPath.startsWith('src/context/')) return 'React Contexts';
  return 'Other';
}

function walkDirectory(dir: string, fileList: FileMetric[] = []): FileMetric[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        walkDirectory(fullPath, fileList);
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      const stat = fs.statSync(fullPath);
      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

      fileList.push({
        filePath: fullPath,
        relativePath,
        lines,
        bytes: stat.size,
        category: categorizeFile(relativePath)
      });
    }
  }

  return fileList;
}

export function runFileAudit() {
  console.log('================================================================');
  console.log('🔍 [Lailah Platform] Frontend & Fullstack File Size Audit Report');
  console.log('================================================================\n');

  const srcDir = path.resolve(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Directory src not found!');
    process.exit(1);
  }

  const allFiles = walkDirectory(srcDir);
  const totalFiles = allFiles.length;
  const totalLines = allFiles.reduce((acc, f) => acc + f.lines, 0);
  const totalBytes = allFiles.reduce((acc, f) => acc + f.bytes, 0);

  const largeFiles = allFiles
    .filter(f => f.lines >= THRESHOLD_LINES)
    .sort((a, b) => b.lines - a.lines);

  console.log(`📊 Total Codebase Files (src/): ${totalFiles}`);
  console.log(`📄 Total Lines of Code: ${totalLines.toLocaleString()}`);
  console.log(`💾 Total Source Size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`⚠️ Files exceeding ${THRESHOLD_LINES} lines: ${largeFiles.length}\n`);

  // Category breakdown
  const categories: Record<string, { count: number; lines: number; largeCount: number }> = {};
  for (const file of allFiles) {
    if (!categories[file.category]) {
      categories[file.category] = { count: 0, lines: 0, largeCount: 0 };
    }
    categories[file.category].count++;
    categories[file.category].lines += file.lines;
    if (file.lines >= THRESHOLD_LINES) {
      categories[file.category].largeCount++;
    }
  }

  console.log('📁 Breakdown by Subsystem / Layer:');
  console.log('----------------------------------------------------------------');
  console.log('| Subsystem Layer                 | Files | Lines   | >1000 Lines |');
  console.log('|---------------------------------|-------|---------|-------------|');
  Object.entries(categories)
    .sort((a, b) => b[1].lines - a[1].lines)
    .forEach(([cat, data]) => {
      const paddedCat = cat.padEnd(31);
      const paddedFiles = String(data.count).padStart(5);
      const paddedLines = data.lines.toLocaleString().padStart(7);
      const paddedLarge = String(data.largeCount).padStart(11);
      console.log(`| ${paddedCat} | ${paddedFiles} | ${paddedLines} | ${paddedLarge} |`);
    });
  console.log('----------------------------------------------------------------\n');

  console.log(`📋 Top High-Density Modules (> ${THRESHOLD_LINES} lines):`);
  console.log('----------------------------------------------------------------');
  largeFiles.forEach((file, index) => {
    const rank = String(index + 1).padStart(2);
    const lines = String(file.lines).padStart(5);
    const kb = (file.bytes / 1024).toFixed(1).padStart(6);
    console.log(`${rank}. [${lines} lines | ${kb} KB] (${file.category}) -> ${file.relativePath}`);
  });

  console.log('\n================================================================');
  console.log('✅ Audit Completed Successfully.');
  console.log('================================================================\n');

  return {
    totalFiles,
    totalLines,
    largeFilesCount: largeFiles.length,
    largeFiles
  };
}

if (process.argv[1] && process.argv[1].endsWith('check-file-sizes.ts')) {
  runFileAudit();
}
