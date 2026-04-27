"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Divider,
  App,
} from "antd";
import {
  MailOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post("/login", values);
      localStorage.setItem("token", res.data.token);
      message.success("Welcome back!");
      router.push("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "#0f0f1a",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#1a1a2e",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}
        styles={{ body: { padding: "40px 36px" } }}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size={28}>
          {/* Logo */}
          <div style={{ textAlign: "center" }}>
            <Space align="center" size={8} style={{ marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: "#7c3aed", fontSize: 26 }} />
              <Text style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 20 }}>
                Sleepiie Shop
              </Text>
            </Space>
            <Title
              level={4}
              style={{ color: "#e2e8f0", margin: 0, fontWeight: 600 }}
            >
              Welcome back
            </Title>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              Sign in to your account
            </Text>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#7c3aed" }} />}
                placeholder="Email address"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#7c3aed" }} />}
                placeholder="Password"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  borderRadius: 10,
                  height: 44,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  border: "none",
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: "rgba(124,58,237,0.15)", margin: 0 }}>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              Don't have an account?
            </Text>
          </Divider>

          <Link href="/register" style={{ display: "block" }}>
            <Button
              block
              style={{
                borderRadius: 10,
                height: 44,
                borderColor: "rgba(124,58,237,0.4)",
                color: "#a78bfa",
                background: "transparent",
              }}
            >
              Create Account
            </Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}
