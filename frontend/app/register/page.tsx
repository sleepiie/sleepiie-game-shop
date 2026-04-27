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
  UserOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: {
    email: string;
    password: string;
    confirm: string;
  }) => {
    if (values.password !== values.confirm) {
      message.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/register", {
        email: values.email,
        password: values.password,
      });
      message.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error ?? "Registration failed");
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
        background: "#0f0f1a",
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
          background:
            "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
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
              Create your account
            </Title>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              Join and start buying game keys
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
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#7c3aed" }} />}
                placeholder="Password"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              rules={[
                { required: true, message: "Please confirm your password" },
              ]}
            >
              <Input.Password
                prefix={<UserOutlined style={{ color: "#7c3aed" }} />}
                placeholder="Confirm password"
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
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: "rgba(124,58,237,0.15)", margin: 0 }}>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              Already have an account?
            </Text>
          </Divider>

          <Link href="/login" style={{ display: "block" }}>
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
              Sign In Instead
            </Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}
