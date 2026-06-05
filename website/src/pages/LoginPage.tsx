import { LockOutlined, MailOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Typography,
  message,
  ConfigProvider,
} from "antd";

const { Title, Text } = Typography;

type LoginFormValue = {
  email: string;
  password: string;
  remember?: boolean;
};

export default function LoginPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = (values: LoginFormValue) => {
    console.log(values);
    messageApi.success("Login berhasil diproses");
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb", // Blue-600
          borderRadius: 12,
        },
      }}
    >
      <main className="min-h-screen flex bg-white  selection:bg-blue-500/20">
        {contextHolder}

        {/* 1. SISI KIRI: HERO & BRANDING SECTION (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-[55%] relative bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-16 flex-col justify-between overflow-hidden">
          {/* Elemen Dekoratif Orbs (Efek Estetis Masa Kini) */}
          <div className="absolute top-[-20%] left-[-10%] w-150 h-150 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 rounded-full bg-indigo-500/10 blur-[100px]" />

          {/* Logo & Brand Name */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 text-xl font-black text-white shadow-lg shadow-blue-500/20">
              S
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              SYREL DIGITAL MANDIRI
            </span>
          </div>

          {/* Slogan / Nilai Jual Utama */}
          <div className="relative z-10 my-auto max-w-xl">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              Automatic Trade {import.meta.env.VITE_APP_VERSION}
            </span>
            <h1 className="text-white text-4xl xl:text-5xl font-extrabold tracking-tight mt-6 leading-[1.15]">
              Kelola ekosistem digital Anda dalam satu genggaman.
            </h1>
            <p className="text-slate-400 mt-4 text-base xl:text-lg leading-relaxed">
              Analisis data real-time, manajemen performa tangguh, dan kontrol
              penuh atas infrastruktur digital bisnis Anda secara cerdas.
            </p>
          </div>

          {/* Footer Kiri */}
          <div className="relative z-10 text-slate-500 text-xs">
            © {new Date().getFullYear()} Syrel Digital Corporation. All rights
            reserved.
          </div>
        </div>

        {/* 2. SISI KANAN: FORM LOGIN SECTION (Penuh di Mobile, Setengah di Desktop) */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-16 lg:px-20 xl:px-24 bg-slate-50 lg:bg-white relative">
          {/* Logo Tambahan Khusus Tampilan Mobile (Akan sembunyi di Desktop) */}
          <div className="flex lg:hidden items-center gap-2 absolute top-8 left-6 sm:left-16">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-base font-black text-white">
              S
            </div>
            <span className="text-slate-900 font-bold text-sm">
              Syrel Digital
            </span>
          </div>

          <div className="w-full max-w-md mx-auto">
            {/* Header Form */}
            <div className="mb-8">
              <Title
                level={2}
                className="mb-2! text-slate-900! font-extrabold! tracking-tight!"
              >
                Selamat Datang Kembali
              </Title>
              <Text className="text-slate-500 text-sm">
                Silakan masuk untuk melanjutkan akses ke dashboard utama Anda.
              </Text>
            </div>

            {/* Form Konten */}
            <Form
              layout="vertical"
              requiredMark={false}
              initialValues={{ remember: true }}
              onFinish={handleLogin}
              autoComplete="off"
            >
              {/* Input Email */}
              <Form.Item
                label={
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Alamat Email
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: "Email wajib diisi" },
                  { type: "email", message: "Format email tidak valid" },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined className="text-slate-400 mr-2" />}
                  placeholder="nama@perusahaan.com"
                  className="h-12 rounded-xl border-slate-200 hover:border-blue-500 focus:border-blue-500 bg-slate-50 lg:bg-white transition-all"
                />
              </Form.Item>

              {/* Input Password */}
              <Form.Item
                label={
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Kata Sandi
                  </span>
                }
                name="password"
                rules={[{ required: true, message: "Password wajib diisi" }]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className="text-slate-400 mr-2" />}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 hover:border-blue-500 focus:border-blue-500 bg-slate-50 lg:bg-white transition-all"
                />
              </Form.Item>

              {/* Baris Opsi Tambahan */}
              <div className="mb-6 flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-slate-600 text-xs sm:text-sm font-medium">
                    Ingat perangkat ini
                  </Checkbox>
                </Form.Item>

                <Button
                  type="link"
                  className="px-0 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-500"
                >
                  Lupa kata sandi?
                </Button>
              </div>

              {/* Tombol Masuk */}
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                className="h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-600/15 active:scale-[0.98] transition-all"
              >
                Masuk ke Console
              </Button>
            </Form>

            {/* Bantuan Teknis */}
            <p className="mt-8 text-center text-xs text-slate-400">
              Butuh bantuan akses?{" "}
              <a href="#" className="text-blue-600 font-medium hover:underline">
                Hubungi Tim IT
              </a>
            </p>
          </div>

          {/* Footer Khusus Tampilan Mobile */}
          <div className="absolute bottom-6 left-0 right-0 text-center lg:hidden text-slate-400 text-[11px]">
            © 2026 Syrel Digital Mandiri. All rights reserved.
          </div>
        </div>
      </main>
    </ConfigProvider>
  );
}
