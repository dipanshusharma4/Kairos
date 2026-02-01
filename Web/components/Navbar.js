"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { IoIosLogOut } from "react-icons/io";
import { HiMenuAlt3 } from "react-icons/hi";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const profileRef = useRef(null);
  const sideBarRef = useRef(null);
  // const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sideBarRef.current && !sideBarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sideBarRef]);

  const getDisplayLinks = () => {
    const homeLink = { href: "/", label: "Home" };
    const aboutLink = { href: "/about", label: "About" };
    const signupLink = { href: "/signup", label: "Signup" };
    const loginLink = { href: "/login", label: "Login" };
    const chatbotLink = { href: "/chatbot", label: "W Buddy" };
    const dashboardLink = { href: "/dashboard", label: "Dashboard" };

    switch (pathname) {
      case "/":
        return [aboutLink, loginLink, signupLink];
      case "/about":
        return [homeLink, loginLink, signupLink];
      case "/signup":
        return [homeLink, aboutLink, loginLink];
      case "/login":
        return [homeLink, aboutLink, signupLink];
      case "/chatbot":
        return [dashboardLink];
      case "/dashboard":
        return [chatbotLink];
      default:
        return [];
    }
  };
  const displayLinks = getDisplayLinks();
  const getButtonStyles = (link) => {
    return "text-[#a7ebf2] hover:text-white font-semibold";
  };
  const isChatbotPage = pathname === "/chatbot";
  const isDashboard = pathname === "/dashboard";

  return (
    <nav className="bg-[#011c40] py-4 pl-4 pr-2 shadow-md sticky top-0 z-50">
      <div className="mx-auto flex justify-between items-center">
        <Link
          href={session ? "/chatbot" : "/"}
          className="z-20 flex items-center gap-3 text-[#a7ebf2] text-2xl font-bold tracking-wider whitespace-nowrap"
        >
          <Image
            src={"/logo.svg"}
            width={40}
            height={40}
            alt="KAIROS logo"
            suppressHydrationWarning={true}
            className="rounded-full"
          />
          <div>KAIROS</div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex">
              {displayLinks.map((link) => (
                <Link
                  suppressHydrationWarning={true}
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full font-medium transition duration-150 ease-in-out ${getButtonStyles(
                    link
                  )}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {session?.user && (isChatbotPage || isDashboard) && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 rounded-full border-2 border-[#a7ebf2] flex-shrink-0 overflow-hidden bg-gray-600"
                >
                  <Image
                    src={session?.user?.image || "/user.png"}
                    alt="User Profile"
                    width={40}
                    height={40}
                    className={
                      !session?.user?.image
                        ? "filter invert p-1"
                        : "object-cover w-full h-full"
                    }
                    unoptimized
                  />
                </button>
                {isProfileOpen && (
                  <div className="absolute top-15 right-0 w-72 bg-[#023859] rounded-lg shadow-xl border border-gray-700 py-2">
                    <div className="px-4 py-3">
                      <p className="font-bold text-white truncate">
                        {session?.user?.name &&
                          session.user.name.charAt(0).toUpperCase() +
                          session.user.name.slice(1)}
                      </p>
                    </div>
                    <div className="md:hidden">
                      {displayLinks.map((link) => (
                        <Link
                          suppressHydrationWarning={true}
                          key={link.href}
                          href={link.href}
                          className={`px-4 py-2 rounded-full font-medium transition duration-150 ease-in-out ${getButtonStyles(
                            link
                          )}`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 px-2">
                      <button
                        onClick={() => signOut({ callbackUrl: "/signup" })}
                        className="flex items-center w-full text-left px-4 py-2 text-lg font-semibold text-red-400 hover:bg-red-500/10 rounded-md border-t-2 border-gray-500 gap-2"
                      >
                        <IoIosLogOut className="text-2xl" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}





























            {!isChatbotPage && !isDashboard && (
              <div className="relative md:hidden" ref={sideBarRef}>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 text-[#a7ebf2] rounded-full hover:bg-white/10"
                >
                  <HiMenuAlt3 className="text-2xl" />
                </button>
                {isSidebarOpen && (
                  <div className="absolute top-14 -right-3.5 w-32 bg-[#023859] rounded-tl-lg rounded-bl-lg shadow-xl border border-gray-700 py-2">

                    <div className="flex flex-col">
                      {displayLinks.map((link) => (
                        <Link
                          suppressHydrationWarning={true}
                          key={link.href}
                          href={link.href}
                          className={`px-4 py-2 rounded-full font-medium transition duration-150 ease-in-out ${getButtonStyles(
                            link
                          )}`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}











          </div>
        </div>
      </div>
    </nav>
  );
}
