const fs = require("fs");
const path = require("path");

// Find all .tsx files in apps/portal that contain <table
function findTableFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      entry.name !== "node_modules" &&
      !fullPath.includes(".next")
    ) {
      findTableFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("<table")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const tableFiles = findTableFiles("apps/portal");
let totalChanges = 0;

for (const file of tableFiles) {
  let content = fs.readFileSync(file, "utf8");
  let original = content;
  let fileChanges = 0;

  // Add scope="col" to <th> elements that don't already have a scope attribute
  // Match <th followed by space, then className or other attributes, but not containing scope=
  content = content.replace(
    /<th\s+(?!.*\bscope=)([^>]*?)>/g,
    (match, attrs) => {
      fileChanges++;
      return `<th scope="col" ${attrs}>`;
    },
  );

  // Fix hardcoded text-[#ccc] in BookInForm.tsx
  if (file.endsWith("BookInForm.tsx")) {
    const beforeCcc = content;
    content = content.replace(/text-\[#ccc\]/g, "text-[var(--text-muted)]");
    if (content !== beforeCcc) {
      fileChanges += (beforeCcc.match(/text-\[#ccc\]/g) || []).length;
    }
  }

  // Fix hardcoded text-[#3ecf8e] in HighResPanel.tsx table cells
  if (file.endsWith("HighResPanel.tsx")) {
    const beforeGreen = content;
    content = content.replace(
      /text-\[#3ecf8e\]/g,
      "text-[var(--accent-green)]",
    );
    if (content !== beforeGreen) {
      fileChanges += (beforeGreen.match(/text-\[#3ecf8e\]/g) || []).length;
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    totalChanges += fileChanges;
    console.log(`Updated: ${file} (${fileChanges} changes)`);
  }
}

console.log(
  `\nTotal changes: ${totalChanges} across ${tableFiles.length} files`,
);
