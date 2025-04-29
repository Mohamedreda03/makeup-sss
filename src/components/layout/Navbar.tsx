import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  // الحصول على جلسة المستخدم
  const session = await auth();

  // معلومات الطرق
  const routes = [
    {
      href: "/",
      label: "Home",
      active: false, // سيتم تحديثه في جانب العميل
    },
    {
      href: "/artists",
      label: "Artists",
      active: false,
    },
    {
      href: "/products",
      label: "Products",
      active: false,
    },
    {
      href: "/about",
      label: "About",
      active: false,
    },
  ];

  // إذا كان المستخدم مسجل الدخول، نحصل على بياناته المحدثة من قاعدة البيانات
  let userData = null;

  if (session?.user?.id) {
    try {
      // الحصول على بيانات المستخدم المحدثة من قاعدة البيانات
      const user = await db.user.findUnique({
        where: {
          id: session.user.id as string,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      if (user) {
        userData = {
          ...user,
          // إضافة معلمة زمنية لمنع التخزين المؤقت للصورة
          image: user.image ? `${user.image}` : null,
        };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // استخدام بيانات الجلسة كبديل في حالة فشل الاستعلام
      userData = session.user;
    }
  }

  // تمرير البيانات إلى مكون العميل
  return <NavbarClient user={userData} routes={routes} />;
}
