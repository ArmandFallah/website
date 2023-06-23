export type Site = {
  name: string;
  email: string;
  num_posts_on_homepage: number;
  num_projects_on_homepage: number;
};

export type Metadata = {
  title: string;
  description: string;
};

export type Socials = {
  name: string;
  href: string;
}[];
