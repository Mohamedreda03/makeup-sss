import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // التحقق من هوية المستخدم
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // استخراج معلومات الصورة من الطلب
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Image URL is required - عنوان الصورة مطلوب" },
        { status: 400 }
      );
    }

    // التحقق من تحديث الصورة في قاعدة البيانات
    if (session.user.id) {
      try {
        // الاستعلام عن بيانات المستخدم للتأكد من تحديث الصورة
        const user = await db.user.findUnique({
          where: {
            id: session.user.id as string,
          },
          select: {
            image: true,
          },
        });

        console.log("Current user image in DB:", user?.image);
        console.log("Requested refresh for image:", imageUrl);

        // إذا لم يتم تحديث الصورة في قاعدة البيانات بعد
        if (user && user.image !== imageUrl) {
          console.log(
            "Image not yet updated in database - سنحاول التحديث مرة أخرى"
          );

          // تأخير قصير قبل إعادة مصادقة المسارات
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (dbError) {
        console.error("Error checking user data:", dbError);
        // استمر في تنفيذ العملية حتى في حالة حدوث خطأ في الاستعلام
      }
    }

    // إعادة مصادقة المكون Navbar لتحديث البيانات من قاعدة البيانات
    revalidatePath("/");

    // اختياري: يمكن إعادة مصادقة مسارات محددة أخرى قد تستخدم مكون Navbar
    revalidatePath("/profile");
    revalidatePath("/products");
    revalidatePath("/artists");
    revalidatePath("/appointments");

    // استجابة إيجابية
    return NextResponse.json(
      {
        success: true,
        message:
          "Navbar image refreshed successfully - تم تحديث صورة شريط التنقل بنجاح",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error refreshing navbar image:", error);
    return NextResponse.json(
      {
        message: "Failed to refresh navbar image - فشل تحديث صورة شريط التنقل",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
