import type { Site, Metadata, Socials } from '@types';

export const SITE: Site = {
  name: 'Armand World',
  email: 'armand@fallah.us',
  num_posts_on_homepage: 3,
  num_projects_on_homepage: 3,
};

export const HOME: Metadata = {
  title: 'Home',
  description: 'Armand World ',
};

export const BLOG: Metadata = {
  title: 'Blog',
  description: 'A collection of articles on topics I am passionate about.',
};

export const PROJECTS: Metadata = {
  title: 'Projects',
  description:
    'A collection of my projects, with links to repositories and demos.',
};

export const SOCIALS: Socials = [
  {
    name: 'github',
    href: 'https://github.com/armandfallah',
  },
  {
    name: 'linkedin',
    href: 'https://www.linkedin.com/in/armand-fallah-8a01a6301/',
  },
];
