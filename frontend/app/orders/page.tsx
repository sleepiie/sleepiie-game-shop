"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Empty,
  Spin,
  Tag,
  Tooltip,
  Collapse,
  App,
} from "antd";
import {
  ShoppingOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { OrderHistoryResponse } from "@/types";

const { Title, Text } = Typography;

const statusConfig: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  pending: {
    color: "warning",
    icon: <ClockCircleOutlined />,
    label: "Pending Payment",
  },
  paid: {
    color: "success",
    icon: <CheckCircleOutlined />,
    label: "Paid",
  },
  failed: {
    color: "error",
    icon: <CloseCircleOutlined />,
    label: "Failed",
  },
};

function GameKeyCard({
  gameId,
  keyValue,
}: {
  gameId: number;
  keyValue: string;
}) {
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(true);
      message.success("Key copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error("Failed to copy");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "rgba(124,58,237,0.06)",
        borderRadius: 10,
        border: "1px solid rgba(124,58,237,0.1)",
      }}
    >
      <Space size={10}>
        <KeyOutlined style={{ color: "#a78bfa", fontSize: 16 }} />
        <div>
          <Text style={{ color: "#64748b", fontSize: 11, display: "block" }}>
            Game #{gameId}
          </Text>
          <Text
            style={{
              color: "#e2e8f0",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {keyValue}
          </Text>
        </div>
      </Space>
      <Tooltip title={copied ? "Copied!" : "Copy key"}>
        <Button
          type="text"
          icon={
            copied ? (
              <CheckCircleOutlined style={{ color: "#22c55e" }} />
            ) : (
              <CopyOutlined style={{ color: "#94a3b8" }} />
            )
          }
          size="small"
          onClick={handleCopy}
          style={{ borderRadius: 8 }}
        />
      </Tooltip>
    </div>
  );
}

function OrderCard({ order }: { order: OrderHistoryResponse }) {
  const config = statusConfig[order.status] ?? statusConfig.pending;
  const hasKeys = order.keys && order.keys.length > 0;
  const date = new Date(order.created_at);

  const collapseItems = [];

  if (order.items && order.items.length > 0) {
    collapseItems.push({
      key: "items",
      label: (
        <Text style={{ color: "#94a3b8", fontSize: 13 }}>
          📦 {order.items.length} {order.items.length === 1 ? "item" : "items"}{" "}
          in this order
        </Text>
      ),
      children: (
        <Space orientation="vertical" style={{ width: "100%" }} size={8}>
          {order.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#e2e8f0", fontSize: 13 }}>
                Game #{item.game_id}
              </Text>
              <Text
                style={{ color: "#a78bfa", fontWeight: 600, fontSize: 13 }}
              >
                ฿{item.price.toLocaleString()}
              </Text>
            </div>
          ))}
        </Space>
      ),
    });
  }

  if (hasKeys) {
    collapseItems.push({
      key: "keys",
      label: (
        <Space size={6}>
          <GiftOutlined style={{ color: "#22c55e" }} />
          <Text style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>
            Your Game Keys
          </Text>
        </Space>
      ),
      children: (
        <Space orientation="vertical" style={{ width: "100%" }} size={8}>
          {order.keys.map((key, i) => (
            <GameKeyCard
              key={i}
              gameId={key.game_id}
              keyValue={key.key_value}
            />
          ))}
        </Space>
      ),
    });
  }

  return (
    <Card
      style={{
        background: "#1a1a2e",
        border: "1px solid rgba(124,58,237,0.12)",
        borderRadius: 16,
        overflow: "hidden",
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {/* Order header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: collapseItems.length > 0 ? 16 : 0,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Space size={10} align="center">
            <Text
              style={{
                color: "#e2e8f0",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              Order #{order.id}
            </Text>
            <Tag
              icon={config.icon}
              color={config.color}
              style={{ borderRadius: 6, margin: 0 }}
            >
              {config.label}
            </Tag>
          </Space>
          <Text
            style={{ color: "#64748b", fontSize: 12, display: "block", marginTop: 4 }}
          >
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </div>

        <Text
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#a78bfa",
          }}
        >
          ฿{order.total_amount.toLocaleString()}
        </Text>
      </div>

      {/* Expandable details */}
      {collapseItems.length > 0 && (
        <Collapse
          ghost
          items={collapseItems}
          style={{ margin: "0 -12px" }}
        />
      )}
    </Card>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [orders, setOrders] = useState<OrderHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data ?? []);
    } catch {
      message.error("Failed to load orders. Please login first.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [message, router]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [fetchOrders, router]);

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      <Navbar />

      <div
        style={{
          position: "relative",
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "40px 24px 0",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              style={{ color: "#94a3b8", marginBottom: 16, padding: "4px 0" }}
            >
              Back to Shop
            </Button>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <HistoryOutlined style={{ fontSize: 28, color: "#7c3aed" }} />
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#e2e8f0",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              Order History
            </Title>
            {orders.length > 0 && (
              <Tag
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color: "#a78bfa",
                  border: "none",
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "2px 12px",
                }}
              >
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </Tag>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 24px 64px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <Spin size="large" />
            </div>
          ) : orders.length === 0 ? (
            <div style={{ paddingTop: 60 }}>
              <Empty
                image={
                  <ShoppingOutlined
                    style={{ fontSize: 64, color: "rgba(124,58,237,0.3)" }}
                  />
                }
                description={
                  <Space orientation="vertical" size={8}>
                    <Text style={{ color: "#64748b", fontSize: 16 }}>
                      No orders yet
                    </Text>
                    <Text style={{ color: "#475569", fontSize: 14 }}>
                      Your purchase history will appear here.
                    </Text>
                  </Space>
                }
              >
                <Link href="/">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    style={{
                      borderRadius: 10,
                      height: 44,
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                      border: "none",
                      marginTop: 8,
                    }}
                  >
                    Start Shopping
                  </Button>
                </Link>
              </Empty>
            </div>
          ) : (
            <Space orientation="vertical" style={{ width: "100%" }} size={16}>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </Space>
          )}
        </div>
      </div>
    </div>
  );
}
