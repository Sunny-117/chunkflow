import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'ChunkFlow Upload SDK',
  description: 'A universal large file upload solution',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/yourusername/chunkflow-upload-sdk' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'Protocol', link: '/api/protocol' },
          ],
        },
      ],
    },
  },
});
