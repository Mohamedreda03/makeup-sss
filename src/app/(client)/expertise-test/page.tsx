"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock3, Sparkles, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ServicesShowcasePage() {
  // بيانات خدمات للعرض
  const services = [
    {
      id: "1",
      name: "مكياج عروس",
      description: "مكياج عروس كامل مع جلسة تجريبية",
      price: 2500,
      duration: 120,
    },
    {
      id: "2",
      name: "مكياج سهرة",
      description: "مكياج كامل للمناسبات الخاصة",
      price: 1500,
      duration: 90,
    },
    {
      id: "3",
      name: "مكياج طبيعي",
      description: "مكياج خفيف وطبيعي للاستخدام اليومي",
      price: 800,
      duration: 60,
    },
    {
      id: "4",
      name: "درس مكياج",
      description: "درس خاص لتعليم تقنيات المكياج الشخصي",
      price: 2000,
      duration: 120,
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">عرض الخدمات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3">بطاقة الخدمات المميزة</h2>
          <Card className="overflow-hidden border-rose-100">
            <CardHeader className="pb-2 bg-gradient-to-r from-rose-50 to-pink-50">
              <CardTitle className="text-lg flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-rose-500" />
                خدماتنا المميزة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {services.slice(0, 2).map((service) => (
                  <div
                    key={service.id}
                    className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-rose-50 border border-pink-100 transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-purple-800">
                        {service.name}
                      </h4>
                      <Badge className="bg-rose-500 hover:bg-rose-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {service.price} ج.م
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-600 flex items-center">
                        <Clock3 className="h-3 w-3 mr-1 text-rose-400" />
                        {service.duration} دقيقة
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">عرض الخبرة</h2>
          <div className="flex items-center gap-1 mb-6 text-gray-600 bg-purple-50 border border-purple-100 rounded-lg p-3">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="font-medium">
              خبرة 8 سنوات في مجال المكياج الاحترافي
            </span>
          </div>

          <h2 className="text-lg font-medium mb-3 mt-6">قائمة الخدمات</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-4 rounded-lg border border-gray-200 transition-all hover:shadow-md hover:border-rose-200 bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-800">{service.name}</h4>
                  <Badge className="bg-gradient-to-r from-rose-500 to-pink-500">
                    {service.price} ج.م
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {service.description}
                </p>
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock3 className="h-3 w-3 mr-1 text-gray-400" />
                  {service.duration} دقيقة
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
