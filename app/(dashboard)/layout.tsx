"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import React from 'react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isArticleEditor = /\/teacher\/blog\/[^/]+/.test(pathname);

  if (isArticleEditor) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-[52px] flex-shrink-0 fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
        <div className="pt-[52px] h-screen overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
        <Navbar />
      </div>
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-56 pt-[80px] h-full">{children}</main>
    </div>
  );
};

export default DashboardLayout;
