"use client";

import React from "react";
import { ConfigProvider, theme, App } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#7c3aed",
          colorBgBase: "#0f0f1a",
          colorBgContainer: "#1a1a2e",
          colorBgElevated: "#16213e",
          borderRadius: 12,
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Card: {
            colorBgContainer: "#1a1a2e",
          },
          Input: {
            colorBgContainer: "#16213e",
          },
          Button: {
            colorPrimary: "#7c3aed",
          },
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
