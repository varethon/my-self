import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const coursesRoot = join(projectRoot, 'public', 'courses');
const manifestPath = join(coursesRoot, 'manifest.json');

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function walk(directory, relativeDirectory = '') {
  const files = [];
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    const entryRelativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath, entryRelativePath));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.mp4') {
      files.push(entryRelativePath.split(sep).join('/'));
    }
  }

  return files;
}

const filesByDirectory = new Map();
for (const filePath of walk(coursesRoot)) {
  const directory = filePath.slice(0, filePath.lastIndexOf('/'));
  const files = filesByDirectory.get(directory) ?? [];
  files.push(filePath);
  filesByDirectory.set(directory, files);
}

const courses = [...filesByDirectory.entries()]
  .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath, 'vi'))
  .map(([directory, filePaths]) => {
    const directoryParts = directory.split('/');
    const courseName = directoryParts.at(-1);
    const category = directoryParts.slice(0, -1).join(' · ');
    const courseId = slugify(directory.replaceAll('/', '-'));
    const lessons = filePaths
      .map((filePath) => {
        const fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
        const match = /^(\d+)\.(.+)\.mp4$/i.exec(fileName);
        const number = match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
        const title = match ? match[2] : fileName.slice(0, -'.mp4'.length);
        return {
          id: `${courseId}-${slugify(title)}`,
          number,
          title,
          filePath,
        };
      })
      .sort((first, second) => first.number - second.number || first.title.localeCompare(second.title, 'vi'));

    return {
      id: courseId,
      title: category ? `${category} · ${courseName}` : courseName,
      category: category || undefined,
      lessons,
    };
  });

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  courses,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Generated course manifest: ${courses.length} courses, ${courses.reduce((total, course) => total + course.lessons.length, 0)} lessons`);
