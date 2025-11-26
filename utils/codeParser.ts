import { VirtualFile } from '../types';

/**
 * Parses markdown text to find code blocks and converts them into VirtualFiles.
 * Supports ```language filename.ext format or just ```language.
 */
export const parseCodeToFiles = (markdown: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const codeBlockRegex = /```(\w+)?(?::([^\s\n]+))?\n([\s\S]*?)```/g;
  
  let match;
  let index = 1;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const language = match[1] || 'text';
    const filenameMeta = match[2]; // Sometimes users/AI put filename here
    let content = match[3];

    // Heuristic to find filename if it's the first line comment in code
    let filename = filenameMeta || `snippet_${index}.${getExtension(language)}`;

    // Clean up content (sometimes has leading newline)
    if (content.startsWith('\n')) content = content.substring(1);

    files.push({
      name: filename,
      path: `/${filename}`,
      language: language,
      content: content
    });
    index++;
  }

  return files;
};

const getExtension = (lang: string): string => {
  const map: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    jsx: 'jsx',
    tsx: 'tsx',
    bash: 'sh',
    shell: 'sh'
  };
  return map[lang] || 'txt';
};