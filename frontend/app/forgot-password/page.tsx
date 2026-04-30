"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  App,
} from "antd";
import {
  MailOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import api from "@/lib/api";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await api.post("/forgot-password", values);
      setSubmitted(true);
      message.success("Reset link sent if email exists.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error ?? "Failed to send reset link");
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
              Reset Password
            </Title>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              Enter your email to receive a reset link
            </Text>
          </div>

          {!submitted ? (
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
                  Send Reset Link
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Text style={{ color: "#22c55e", fontSize: 16, display: "block", marginBottom: 8 }}>
                Email Sent! 🎉
              </Text>
              <Text style={{ color: "#94a3b8", display: "block", marginBottom: 24 }}>
                Check your inbox for instructions to reset your password.
              </Text>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <Link href="/login">
              <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: "#94a3b8" }}>
                Back to Login
              </Button>
            </Link>
          </div>
        </Space>
      </Card>
    </div>
  );
}
