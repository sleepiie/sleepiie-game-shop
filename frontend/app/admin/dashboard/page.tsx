"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Empty,
  Spin,
  App,
  Tabs,
} from "antd";
import {
  DashboardOutlined,
  PlusOutlined,
  DeleteOutlined,
  KeyOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Game } from "@/types";

const { Title, Text } = Typography;
const { Option } = Select;

interface RevenueSummary {
  total_revenue: number;
  total_orders: number;
  daily_revenue: { date: string; revenue: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Modals
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [gameForm] = Form.useForm();
  const [keysForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Check admin role
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        message.error("Access denied. Admins only.");
        router.push("/");
        return;
      }

      const [revRes, gamesRes, ordersRes] = await Promise.all([
        api.get("/admin/revenue"),
        api.get("/games"),
        api.get("/admin/orders"),
      ]);

      setRevenue(revRes.data);
      setGames(gamesRes.data.data);
      setOrders(ordersRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        message.error("Access denied. Admins only.");
        router.push("/");
      } else {
        message.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  }, [message, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateGame = async (values: any) => {
    try {
      await api.post("/admin/games", values);
      message.success("Game created successfully");
      setIsGameModalOpen(false);
      gameForm.resetFields();
      fetchData();
    } catch {
      message.error("Failed to create game");
    }
  };

  const handleDeleteGame = (id: number) => {
    modal.confirm({
      title: "Delete Game",
      content: "Are you sure you want to delete this game? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await api.delete(`/admin/games/${id}`);
          message.success("Game deleted");
          fetchData();
        } catch {
          message.error("Failed to delete game");
        }
      },
    });
  };

  const handleAddKeys = async (values: { keys: string }) => {
    if (!selectedGameId) return;
    try {
      const keysArray = values.keys.split("\n").filter((k) => k.trim() !== "");
      await api.post(`/admin/games/${selectedGameId}/keys`, { keys: keysArray });
      message.success(`Added ${keysArray.length} keys`);
      setIsKeysModalOpen(false);
      keysForm.resetFields();
      fetchData();
    } catch {
      message.error("Failed to add keys");
    }
  };

  const gameColumns = [
    {
      title: "Game",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Game) => (
        <Space>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              background: record.image_url
                ? `url(${record.image_url}) center/cover`
                : "#1a1a2e",
              border: "1px solid rgba(124,58,237,0.1)",
            }}
          />
          <div>
            <Text style={{ color: "#e2e8f0", fontWeight: 600, display: "block" }}>{text}</Text>
            <Tag color="blue" style={{ fontSize: 10, borderRadius: 4 }}>{record.platform}</Tag>
          </div>
        </Space>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) => <Text style={{ color: "#a78bfa" }}>฿{price.toLocaleString()}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Game) => (
        <Space>
          <Button
            type="text"
            icon={<KeyOutlined style={{ color: "#22c55e" }} />}
            onClick={() => {
              setSelectedGameId(record.id);
              setIsKeysModalOpen(true);
            }}
          >
            Add Keys
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteGame(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleCancelOrder = (id: number) => {
    modal.confirm({
      title: "Cancel Order",
      content: "Are you sure you want to cancel this order? It will be marked as failed.",
      okText: "Cancel Order",
      okType: "danger",
      cancelText: "Keep Order",
      onOk: async () => {
        try {
          await api.post(`/admin/orders/${id}/cancel`);
          message.success("Order cancelled");
          fetchData();
        } catch {
          message.error("Failed to cancel order");
        }
      },
    });
  };

  const orderColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (id: number) => <Text style={{ color: "#94a3b8" }}>#{id}</Text>,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => (
        <Text style={{ color: "#64748b", fontSize: 10 }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => (
        <Text style={{ color: "#e2e8f0", fontWeight: 600 }}>฿{amount.toLocaleString()}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "paid" ? "success" : status === "failed" ? "error" : "warning"} style={{ fontSize: 10 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        record.status === "pending" && (
          <Button
            type="text"
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleCancelOrder(record.id)}
          >
            Cancel
          </Button>
        )
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Space align="center" size={12}>
            <DashboardOutlined style={{ fontSize: 28, color: "#7c3aed" }} />
            <Title level={2} style={{ margin: 0, color: "#e2e8f0", fontWeight: 700 }}>Admin Dashboard</Title>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsGameModalOpen(true)}
            style={{
              borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              border: "none",
              height: 44,
            }}
          >
            Create New Game
          </Button>
        </div>

        {/* Stats Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16,
              }}
            >
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>Total Revenue</Text>}
                value={revenue?.total_revenue ?? 0}
                prefix={<DollarCircleOutlined style={{ color: "#7c3aed" }} />}
                precision={2}
                styles={{
                  content: { color: "#a78bfa", fontWeight: 700 },
                  title: { color: "#94a3b8" },
                  prefix: { color: "#7c3aed" },

                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16,
              }}
            >
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>Total Orders</Text>}
                value={revenue?.total_orders ?? 0}
                prefix={<ShoppingOutlined style={{ color: "#22c55e" }} />}
                styles={{ content: { color: "#e2e8f0", fontWeight: 700 }, title: { color: "#94a3b8" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16,
              }}
            >
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>Total Games</Text>}
                value={games.length}
                prefix={<ThunderboltOutlined style={{ color: "#f59e0b" }} />}
                styles={{ content: { color: "#e2e8f0", fontWeight: 700 } }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Revenue Chart */}
          <Col xs={24} lg={16}>
            <Card
              title={<Text style={{ color: "#e2e8f0", fontWeight: 600 }}>Revenue Trend</Text>}
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16,
                height: "100%",
              }}
              styles={{ body: { padding: "24px 16px" } }}
            >
              <div style={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue?.daily_revenue ?? []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <RechartsTooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8 }}
                      itemStyle={{ color: "#a78bfa" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7c3aed"
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Recent Orders */}
          <Col xs={24} lg={8}>
            <Card
              title={<Text style={{ color: "#e2e8f0", fontWeight: 600 }}>Recent Orders</Text>}
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16,
                height: "100%",
              }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                dataSource={orders}
                columns={orderColumns}
                pagination={{
                  pageSize: 7,
                  size: "small",
                  simple: true,
                  style: { margin: "12px 8px" }
                }}
                size="small"
                rowKey="id"
                style={{ background: "transparent" }}
              />
            </Card>
          </Col>

          {/* Games Management */}
          <Col span={24}>
            <Card
              title={<Text style={{ color: "#e2e8f0", fontWeight: 600 }}>Games Management</Text>}
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.15)",
                borderRadius: 16,
              }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                dataSource={games}
                columns={gameColumns}
                rowKey="id"
                style={{ background: "transparent" }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Create Game Modal */}
      <Modal
        title={<Title level={4} style={{ color: "#e2e8f0", margin: 0 }}>Create New Game</Title>}
        open={isGameModalOpen}
        onCancel={() => setIsGameModalOpen(false)}
        footer={null}
        centered
        styles={{
          body: { background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 20, padding: 24 },
          header: { background: "transparent", borderBottom: "1px solid rgba(124,58,237,0.1)" },
        }}
      >
        <Form
          form={gameForm}
          layout="vertical"
          onFinish={handleCreateGame}
          style={{ marginTop: 20 }}
          requiredMark={false}
        >
          <Form.Item name="title" label={<Text style={{ color: "#94a3b8" }}>Game Title</Text>} rules={[{ required: true }]}>
            <Input placeholder="Cyberpunk 2077" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="description" label={<Text style={{ color: "#94a3b8" }}>Description</Text>}>
            <Input.TextArea placeholder="Epic open world RPG..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label={<Text style={{ color: "#94a3b8" }}>Price (THB)</Text>} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%", borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="platform" label={<Text style={{ color: "#94a3b8" }}>Platform</Text>} rules={[{ required: true }]}>
                <Select placeholder="Select Platform" style={{ borderRadius: 8 }}>
                  <Option value="Steam">Steam</Option>
                  <Option value="PlayStation">PlayStation</Option>
                  <Option value="Xbox">Xbox</Option>
                  <Option value="Nintendo">Nintendo</Option>
                  <Option value="Epic Games">Epic Games</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="image_url" label={<Text style={{ color: "#94a3b8" }}>Image URL</Text>}>
            <Input placeholder="https://..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsGameModalOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ borderRadius: 8, background: "#7c3aed" }}>Create Game</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Keys Modal */}
      <Modal
        title={<Title level={4} style={{ color: "#e2e8f0", margin: 0 }}>Add Game Keys</Title>}
        open={isKeysModalOpen}
        onCancel={() => setIsKeysModalOpen(false)}
        footer={null}
        centered
        styles={{
          body: { background: "#1a1a2e", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 20, padding: 24 },
        }}
      >
        <Form
          form={keysForm}
          layout="vertical"
          onFinish={handleAddKeys}
          style={{ marginTop: 20 }}
          requiredMark={false}
        >
          <Form.Item
            name="keys"
            label={<Text style={{ color: "#94a3b8" }}>Enter Game Keys (one per line)</Text>}
            rules={[{ required: true, message: "Please enter at least one key" }]}
          >
            <Input.TextArea
              placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY"
              rows={6}
              style={{ borderRadius: 8, fontFamily: "monospace" }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsKeysModalOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ borderRadius: 8, background: "#7c3aed" }}>Add Keys</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
