export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">ページが見つかりません</h2>
        <p className="text-slate-600 mb-4">お探しのページは存在しないか、移動されました。</p>
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  )
}




