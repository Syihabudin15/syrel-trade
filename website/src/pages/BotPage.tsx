import { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Switch,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Space,
  Tooltip,
} from "antd";
import {
  Plus,
  Edit3,
  Trash2,
  Bot,
  Sliders,
  Layers,
  Search,
  Eye,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";

// Import interfaces dari file eksternal kamu
import { IBot, EBotType } from "../libs/IInterfaces";
import { Link } from "react-router-dom";

export default function BotPage() {
  const [bots, setBots] = useState<IBot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State untuk Modal Form (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBot, setEditingBot] = useState<IBot | null>(null);
  const [form] = Form.useForm();

  // State untuk Filter lokal
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Fetch data bot
  const fetchBots = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bot");
      const { data } = await res.json();
      setBots(data);
    } catch (error) {
      message.error("Gagal memuat data bot.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  // Handle Aktif/Nonaktif Bot via Switch
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await fetch(
        `/api/bot/${id}/${currentStatus ? "stop" : "start"}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          // body: JSON.stringify({ active: nextStatus }),
        },
      );
      if (!res.ok) throw new Error();

      setBots((prev) =>
        prev.map((b) => (b.id === id ? { ...b, active: nextStatus } : b)),
      );
      message.success(`Bot ${nextStatus ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      message.error("Gagal mengubah status bot.");
    }
  };

  // Buka modal untuk Tambah Baru atau Edit
  const openModal = (bot: IBot | null = null) => {
    setEditingBot(bot);
    if (bot) {
      form.setFieldsValue({
        id: bot.id,
        name: bot.name,
        type: bot.type,
        description: bot.description,
        active: false,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // Simpan Data (POST atau PATCH)
  const handleSaveBot = async () => {
    try {
      const values = await form.validateFields();
      const url = editingBot ? `/api/bot/${editingBot.id}` : "/api/bot";
      const method = editingBot ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error();

      message.success(
        `Bot berhasil ${editingBot ? "diperbarui" : "ditambahkan"}`,
      );
      setIsModalOpen(false);
      fetchBots(); // Refresh data
    } catch (error) {
      message.error("Gagal menyimpan data bot. Periksa kembali form Anda.");
    }
  };

  // Hapus Bot
  const handleDeleteBot = async (id: string) => {
    try {
      const res = await fetch(`/api/bot/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      message.success("Bot berhasil dihapus.");
      setBots((prev) => prev.filter((b) => b.id !== id));
    } catch {
      message.error("Gagal menghapus bot.");
    }
  };

  // Helper warna badge tipe bot
  const getBotTypeTag = (type: EBotType) => {
    const config = {
      [EBotType.SMC]: { color: "gold", text: "SMC" },
      [EBotType.TRADING]: { color: "blue", text: "TRADING" },
      [EBotType.SCANNER]: { color: "purple", text: "SCANNER" },
    };
    return (
      <Tag color={config[type]?.color || "default"}>
        {config[type]?.text || type}
      </Tag>
    );
  };

  // Filter logika untuk search bar dan dropdown
  const filteredBots = bots.filter((bot) => {
    const matchSearch =
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bot.description &&
        bot.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType =
      typeFilter === "ALL" || bot.type === (typeFilter as unknown as EBotType);
    return matchSearch && matchType;
  });

  // ==========================================
  // STRUKTUR TABEL MANAJEMEN
  // ==========================================
  const columns: ColumnsType<IBot> = [
    {
      title: "Info Bot",
      key: "bot_info",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="p-2  rounded-lg text-slate-600">
            <Bot size={20} />
          </div>
          <div>
            <div className="font-bold  text-sm">{record.name}</div>
            <div className="text-xs text-slate-400 max-w-62.5 truncate">
              {record.description || "Tanpa deskripsi"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Strategi / Tipe",
      dataIndex: "type",
      key: "type",
      render: (type: EBotType) => getBotTypeTag(type),
    },
    {
      title: "Status Sistem",
      dataIndex: "active",
      key: "active",
      render: (active, record) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={active}
            onChange={() => handleToggleActive(record.id, record.active)}
            size="small"
          />
          <span
            className={`text-xs font-medium ${active ? "text-emerald-600" : "text-slate-400"}`}
          >
            {active ? "Running" : "Idle"}
          </span>
        </div>
      ),
    },
    {
      title: "Dibuat Pada",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <span className="text-xs text-slate-500">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Detail bot">
            <Link
              to={
                record.type === "TRADING"
                  ? `/bot/detail/${record.id}`
                  : `/bot/pump_scanner/${record.id}`
              }
            >
              <Button
                type="text"
                icon={<Eye size={16} className="text-indigo-600" />}
              />
            </Link>
          </Tooltip>
          <Tooltip title="Edit Parameter">
            <Button
              type="text"
              icon={<Edit3 size={16} className="text-indigo-600" />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus Bot">
            <Popconfirm
              title="Hapus instance bot ini?"
              description="Tindakan ini tidak bisa dibatalkan."
              onConfirm={() => handleDeleteBot(record.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<Trash2 size={16} />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className=" rounded-2xl shadow-sm border border-slate-100 p-6">
      {/* CONTROL BAR (HEADER MANAJEMEN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold  flex items-center gap-2">
            <Sliders size={22} className="text-indigo-600" /> Bot Core
            Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Konfigurasi, deploy, and eliminasi arsitektur bot trading kamu.
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} className="inline mr-1" />}
          className="bg-indigo-600 hover:bg-indigo-700 border-none flex items-center h-10 rounded-lg font-medium"
          onClick={() => openModal(null)}
        >
          Deploy New Bot
        </Button>
      </div>

      {/* FILTER CONTROLLER */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 rounded-xl border border-slate-100">
        <Input
          placeholder="Cari nama atau deskripsi bot..."
          prefix={<Search size={14} className="text-slate-400" />}
          className="max-w-xs rounded-lg"
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select
          defaultValue="ALL"
          className="w-40"
          onChange={(value) => setTypeFilter(value)}
          options={[
            { value: "ALL", label: "Semua Tipe Strategi" },
            { value: EBotType.SMC, label: "Smart Money (SMC)" },
            { value: EBotType.TRADING, label: "Standard Trading" },
            { value: EBotType.SCANNER, label: "Market Scanner" },
          ]}
        />
      </div>

      {/* MAIN TABLE */}
      <Table
        dataSource={filteredBots}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        className="border border-slate-100 rounded-xl overflow-hidden"
        scroll={{ x: true }}
      />

      {/* DYNAMIC MODAL (FORM TAMBAH / EDIT) */}
      <Modal
        title={
          <div className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Layers size={18} className="text-indigo-600" />
            {editingBot
              ? "Update Engine Configuration"
              : "Deploy Strategy Configuration"}
          </div>
        }
        style={{ top: 20 }}
        open={isModalOpen}
        onOk={handleSaveBot}
        onCancel={() => setIsModalOpen(false)}
        okText={editingBot ? "Simpan Perubahan" : "Deploy Sekarang"}
        cancelText="Batal"
        okButtonProps={{ className: "bg-indigo-600 text-white border-none" }}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          initialValues={{ type: EBotType.TRADING }}
        >
          <Form.Item
            name="id"
            label={<span className="font-semibold text-slate-700">ID Bot</span>}
            rules={[{ required: true, message: "Nama bot wajib diisi!" }]}
          >
            <Input placeholder="bot1" className="rounded-lg h-9" />
          </Form.Item>
          <Form.Item
            name="name"
            label={
              <span className="font-semibold text-slate-700">Nama Bot</span>
            }
            rules={[{ required: true, message: "Nama bot wajib diisi!" }]}
          >
            <Input
              placeholder="Contoh: Scalper_H1_Breakout"
              className="rounded-lg h-9"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={
              <span className="font-semibold text-slate-700">
                Tipe Strategi
              </span>
            }
            rules={[{ required: true }]}
          >
            <Select
              className="h-9"
              options={[
                { value: EBotType.SMC, label: "Smart Money Concept (SMC)" },
                { value: EBotType.TRADING, label: "Direct Trading Execution" },
                { value: EBotType.SCANNER, label: "Pure Market Scanner" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="font-semibold text-slate-700">
                Deskripsi Operasional
              </span>
            }
          >
            <Input.TextArea
              placeholder="Jelaskan rules singkat bot ini (Timeframe, Indikator, dll)..."
              rows={3}
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
