/**
 * Rehype plugin: convert links to YouTube (youtube.com, youtu.be) into responsive iframe embeds.
 */
import { visit } from 'unist-util-visit';

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractYouTubeId(href) {
  if (!href || typeof href !== 'string') return null;
  const m = href.match(YOUTUBE_REGEX);
  return m ? m[1] : null;
}

export default function rehypeYouTubeEmbed() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index == null || node.tagName !== 'a') return;
      const href = node.properties?.href;
      const id = extractYouTubeId(href);
      if (!id) return;

      const embedUrl = `https://www.youtube.com/embed/${id}`;
      const iframe = {
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: embedUrl,
          title: 'Vidéo YouTube',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: true,
          loading: 'lazy',
          width: '560',
          height: '315',
          class: 'w-full aspect-video rounded-lg',
        },
        children: [],
      };
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { class: 'youtube-embed my-6' },
        children: [iframe],
      };
      parent.children[index] = wrapper;
    });
  };
}
