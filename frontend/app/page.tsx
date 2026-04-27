"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Input,
  Card,
  Tag,
  Typography,
  Space,
  Badge,
  Button,
  Avatar,
  Dropdown,
  Empty,
  Spin,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Game } from "@/types";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const platformColors: Record<string, string> = {
  Steam: "blue",
  PlayStation: "geekblue",
  Xbox: "green",
  Nintendo: "red",
  "Epic Games": "purple",
};

function GameCard({ game }: { game: Game }) {
  const outOfStock = game.in_stock === 0;

  return (
    <Badge.Ribbon
      text={outOfStock ? "Out of Stock" : `${game.in_stock} left`}
      color={outOfStock ? "#4a4a6a" : "#7c3aed"}
    >
      <Card
        hoverable={!outOfStock}
        cover={
          <div
            style={{
              height: 200,
              background: game.image_url
                ? `url(${game.image_url}) center/cover no-repeat`
                : "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {!game.image_url && (
              <ThunderboltOutlined
                style={{ fontSize: 48, color: "rgba(124,58,237,0.4)" }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(26,26,46,0.9) 0%, transparent 60%)",
              }}
            />
          </div>
        }
        styles={{
          body: { padding: "16px" },
        }}
        style={{
          background: "#1a1a2e",
          border: "1px solid rgba(124,58,237,0.15)",
          borderRadius: 16,
          overflow: "hidden",
          opacity: outOfStock ? 0.6 : 1,
          transition: "all 0.3s ease",
        }}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size={8}>
          <Tag
            color={platformColors[game.platform] ?? "default"}
            style={{ borderRadius: 6, fontSize: 11 }}
          >
            {game.platform}
          </Tag>
          <Title
            level={5}
            style={{ margin: 0, color: "#e2e8f0", lineHeight: 1.3 }}
          >
            {game.title}
          </Title>
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}
          >
            {game.description || "No description available."}
          </Paragraph>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#a78bfa",
              }}
            >
              ฿{game.price.toLocaleString()}
            </Text>
            <Button
              type="primary"
              size="small"
              disabled={outOfStock}
              icon={<ShoppingCartOutlined />}
              style={{ borderRadius: 8 }}
            >
              Add to Cart
            </Button>
          </div>
        </Space>
      </Card>
    </Badge.Ribbon>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  const fetchGames = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await api.get("/games", { params });
      setGames(res.data.data ?? []);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames("");
  }, [fetchGames]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    fetchGames(value);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const userMenuItems = [
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      {/* Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(15,15,26,0.85)",
          backdropFilter: "blur(16px)",
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
              style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}
            >
              Sleepiie Shop
            </Text>
          </Space>
        </Link>

        <Space size={12}>
          {isLoggedIn ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                icon={<UserOutlined />}
                style={{ background: "#7c3aed", cursor: "pointer" }}
              />
            </Dropdown>
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

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "72px 24px 48px",
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.25) 0%, transparent 70%)",
        }}
      >
        <Title
          style={{
            color: "#e2e8f0",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-1px",
            marginBottom: 12,
          }}
        >
          Your Game Keys,{" "}
          <span style={{ color: "#a78bfa" }}>Instantly Delivered</span>
        </Title>
        <Paragraph
          style={{ color: "#94a3b8", fontSize: 16, marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}
        >
          Browse thousands of game keys for every platform at the best prices.
        </Paragraph>

        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Search
            placeholder="Search games..."
            size="large"
            allowClear
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined style={{ color: "#7c3aed" }} />}
            style={{ borderRadius: 12 }}
          />
        </div>
      </section>

      {/* Game Grid */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 64px" }}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <Spin size="large" />
          </div>
        ) : games.length === 0 ? (
          <div style={{ paddingTop: 80 }}>
            <Empty
              description={
                <Text style={{ color: "#64748b" }}>
                  No games found{searchValue ? ` for "${searchValue}"` : ""}
                </Text>
              }
            />
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ color: "#64748b", fontSize: 14 }}>
                {games.length} game{games.length !== 1 ? "s" : ""} available
              </Text>
            </div>
            <Row gutter={[20, 20]}>
              {games.map((game) => (
                <Col key={game.id} xs={24} sm={12} md={8} lg={6}>
                  <GameCard game={game} />
                </Col>
              ))}
            </Row>
          </>
        )}
      </main>
    </div>
  );
}
