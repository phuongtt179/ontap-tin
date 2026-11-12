// Một lựa chọn của câu trắc nghiệm / đúng-sai (tô xanh / đỏ khi đã xác nhận).

export default function OptionButton({ label, text, imageUrl, selected, confirmed, correct, onClick }) {
  let cls = 'flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition '
  if (confirmed && correct) cls += 'bg-green-50 border-green-500 text-green-800'
  else if (confirmed && selected && !correct) cls += 'bg-red-50 border-red-400 text-red-700'
  else if (selected) cls += 'border-indigo-500 bg-indigo-50 text-indigo-800'
  else cls += 'border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'

  return (
    <button onClick={onClick} disabled={confirmed} className={cls}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${confirmed && correct ? 'bg-green-500 text-white'
          : confirmed && selected ? 'bg-red-400 text-white'
          : selected ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-500'}`}>
        {label}
      </span>
      <span className="flex-1">
        {text}
        {imageUrl && <img src={imageUrl} alt="" className="mt-1 rounded max-h-20 w-auto" />}
      </span>
    </button>
  )
}
