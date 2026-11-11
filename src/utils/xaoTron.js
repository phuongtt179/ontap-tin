// Xáo trộn danh sách (Fisher–Yates: mọi thứ tự có khả năng như nhau). Không sửa mảng gốc.
// Xáo xong mà vẫn y nguyên thứ tự ban đầu (dễ gặp khi ít phần tử) thì xoay 1 nấc — để học sinh không nhận
// sẵn đáp án đúng ở câu sắp xếp / ghép cặp / kéo thả.
export function xaoTron(arr) {
  const a = [...(arr || [])]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.length > 1 && a.every((x, i) => x === arr[i])) a.push(a.shift())
  return a
}
