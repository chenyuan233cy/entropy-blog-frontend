import { notFound } from "next/navigation";
import { isOwnerRequest } from "./modules";

/**
 * 后台页面（写作、管理、站点配置）的服务端门。
 *
 * <p>以前这些页面靠客户端组件挡，非站长会看到一句「这里只有站长能进」—— 状态码还是 200，
 * 等于明说「这个地址有东西，只是你没权限」，顺着 /manage、/write、/settings 一试就知道后台在哪。
 * 现在非站长拿到的就是普通的 404，和外键失效的链接长得一样。
 *
 * <p>这只是「别让人看出有什么」，真正的权限在接口那一层（每个写接口都要 ADMIN 令牌）。
 */
export async function requireOwner() {
  if (!(await isOwnerRequest())) notFound();
}
