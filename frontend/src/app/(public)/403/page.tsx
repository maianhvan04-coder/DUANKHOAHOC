import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1>403 - Forbidden</h1>
      <p>Bạn không có quyền truy cập trang này.</p>
      <Link href="/">Về trang chủ</Link>
    </main>
  );
}
