export type Accent = "sage" | "clay" | "dust" | "haze" | "sand";

/** Ids travel as strings: a 19 digit snowflake id does not survive JSON.parse as a number. */
export type Id = string;

export interface CategoryRef {
  id: Id;
  name: string;
  slug: string;
  accent: Accent | null;
}

export interface TagRef {
  id: Id;
  name: string;
  slug: string;
  accent: Accent | null;
}

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

export interface Entry {
  id: Id;
  title: string;
  slug: string;
  summary: string | null;
  coverUrl: string | null;
  category: CategoryRef | null;
  tags: TagRef[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingMinutes: number;
  top: boolean;
  publishedAt: string | null;
}

export interface Article extends Entry {
  contentHtml: string;
  /** the API calls this toc; the outline component consumes it */
  toc: OutlineItem[];
  wordCount: number;
  allowComment: boolean;
  updateTime: string | null;
  adjacent: { previous: { title: string; slug: string } | null; next: { title: string; slug: string } | null };
  related: Entry[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface Paged<T> {
  page: number;
  size: number;
  total: number;
  pages: number;
  hasNext: boolean;
  list: T[];
}

export interface Reply {
  id: Id;
  parentId: Id;
  replyToName: string | null;
  nickname: string;
  avatar: string | null;
  website: string | null;
  content: string;
  likeCount: number;
  admin: boolean;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM";
  reportCount: number;
  /** 自己写的：给「删除」不给「举报」 */
  mine: boolean;
  replies: Reply[];
}

export interface RecentReply {
  id: Id;
  nickname: string;
  avatar: string | null;
  content: string;
  postSlug: string | null;
  postTitle: string | null;
  createdAt: string;
}

export interface Playlist {
  id: Id;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  sortOrder: number | null;
  tracks: Track[];
}

export interface Track {
  id: Id;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  audioUrl: string;
  lyric: string | null;
  duration: number;
  sortOrder: number | null;
}

export interface ShelfGroup {
  year: number;
  count: number;
  posts: { id: Id; title: string; slug: string; summary: string | null; publishedAt: string }[];
}

export interface SearchHit {
  post: Entry;
  matchedTags: string[];
}

export interface Category extends CategoryRef {
  description: string | null;
  sortOrder: number;
  postCount: number;
}

export interface Tag extends TagRef {
  postCount: number;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface SiteConfig {
  site?: {
    name?: string; tagline?: string; description?: string; keywords?: string;
    /** 站点图标：侧栏、页脚、浏览器标签页都用它。留空就用站点名首字 */
    logo?: string;
    icp?: string; copyright?: string; startAt?: string | null;
  };
  author?: { nickname?: string; bio?: string; avatar?: string; location?: string; email?: string };
  social?: SocialLink[];
  player?: { defaultPlaylist?: string; autoplay?: boolean; folded?: boolean };
  post?: { pageSize?: number };
  comment?: { pageSize?: number; requireEmail?: boolean };
  seo?: { ogImage?: string };
  /** 侧栏模块开关，键名见 data/modules.ts。缺省视为开启。 */
  module?: Record<string, boolean>;
  /** 赞助方式，在「站点配置 → 赞助」里写。关于页和赞助页共用这一份 */
  sponsor?: { note?: string };
  /** 关于页正文最后一段，在「站点配置 → 关于」里写 */
  about?: { note?: string };
  /** 上传上限来自 application.yml，前端拿它做本地预检，免得上传完才被拒 */
  upload?: { maxFileBytes?: number };
}

export interface SiteStats {
  postCount: number;
  draftCount: number;
  tagCount: number;
  categoryCount: number;
  commentCount: number;
  pendingCommentCount: number;
  trackCount: number;
  totalWords: number;
  startAt: string | null;
}

/** 一条赞助方式：TEXT 文字 / LINK 链接 / IMAGE 图片（赞赏码那种） */
export interface SponsorMethod {
  id: Id;
  name: string;
  kind: "TEXT" | "LINK" | "IMAGE";
  content: string;
  sortOrder: number;
}

export interface Sponsor {
  id: Id;
  name: string;
  /** 0 表示对方不想露数额 */
  amount: number;
  message: string | null;
  avatarUrl: string | null;
  link: string | null;
  sponsoredAt: string | null;
  visible: boolean;
  sortOrder: number;
}

export interface ToolNode {
  id: Id;
  parentId: Id;
  kind: "FOLDER" | "FILE";
  name: string;
  url: string | null;
  size: number;
  mime: string | null;
  ext: string | null;
  description: string | null;
  downloadCount: number;
  hasChildren: boolean;
  createTime: string | null;
}

export interface ToolListing {
  path: { id: Id; name: string }[];
  nodes: ToolNode[];
  folderCount: number;
  fileCount: number;
  totalSize: number;
}

export interface AdminEntry {
  id: Id; title: string; slug: string; status: "DRAFT" | "PUBLISHED";
  categoryName: string | null; tagNames: string[];
  viewCount: number; commentCount: number; readingMinutes: number;
  top: boolean; publishedAt: string | null; updateTime: string | null;
}

export interface AdminArticle {
  id: Id; title: string; slug: string; summary: string | null; coverUrl: string | null;
  contentMd: string; categoryId: Id | null; tagIds: Id[]; status: "DRAFT" | "PUBLISHED";
  top: boolean; allowComment: boolean; seoTitle: string | null; seoDescription: string | null;
  publishedAt: string | null; createTime: string | null; updateTime: string | null;
}

export interface AdminReply {
  id: Id; postId: Id; postTitle: string | null; parentId: Id; replyToName: string | null;
  nickname: string; email: string | null; website: string | null; content: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SPAM"; admin: boolean; createdAt: string;
  reportCount: number;
}

export interface ConfigItem {
  key: string; value: string | null;
  valueType: "STRING" | "TEXT" | "NUMBER" | "BOOL" | "JSON";
  groupName: string; description: string | null;
}

export interface ConfigGroup { group: string; items: ConfigItem[] }

/** 会话：两个令牌都只走 HttpOnly cookie，响应体里只有用户资料和有效期。 */
export interface Session {
  expiresIn: number;
  user: { id: Id; username: string; nickname: string; email: string | null; avatar: string | null; role: string };
}
