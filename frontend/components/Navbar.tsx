"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Typography, Space, Badge, Button, Avatar, Dropdown } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const { Text } = Typography;

interface NavbarProps {
  cartCount?: number;
  onCartCountChange?: (count: number) => void;
}

export default function Navbar({ cartCount: externalCartCount, onCartCountChange }: NavbarProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [internalCartCount, setInternalCartCount] = useState(0);

  const cartCount = externalCartCount ?? internalCartCount;

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await api.get("/cart");
      const count = res.data.total_items ?? 0;
      setInternalCartCount(count);
      onCartCountChange?.(count);
    } catch {
      setInternalCartCount(0);
    }
  }, [onCartCountChange]);

  useEffect(() => {
    const loggedIn = !!localStorage.getItem("token");
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      fetchCartCount();
    }
  }, [fetchCartCount]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setInternalCartCount(0);
    router.push("/");
  };

  const userMenuItems = [
    {
      key: "orders",
      label: "Order History",
      icon: <HistoryOutlined />,
      onClick: () => router.push("/orders"),
    },
    { type: "divider" as const },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(15,15,26,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <Space align="center" size={8}>
          <ThunderboltOutlined style={{ color: "#7c3aed", fontSize: 22 }} />
          <Text
            style={{
              color: "#e2e8f0",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.5px",
            }}
          >
            Sleepiie Shop
          </Text>
        </Space>
      </Link>

      <Space size={12}>
        {isLoggedIn ? (
          <>
            <Link href="/cart">
              <Badge count={cartCount} size="small" offset={[-2, 2]} color="#7c3aed">
                <Button
                  type="text"
                  icon={<ShoppingCartOutlined style={{ fontSize: 20, color: "#94a3b8" }} />}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </Badge>
            </Link>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                icon={<UserOutlined />}
                style={{ background: "#7c3aed", cursor: "pointer" }}
              />
            </Dropdown>
          </>
        ) : (
          <>
            <Button
              type="text"
              onClick={() => router.push("/login")}
              style={{ color: "#94a3b8" }}
            >
              Login
            </Button>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => router.push("/register")}
              style={{ borderRadius: 8 }}
            >
              Register
            </Button>
          </>
        )}
      </Space>
    </header>
  );
}
