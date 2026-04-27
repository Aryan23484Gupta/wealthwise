import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "../utils/finance";

export default function TransactionTable({ transactions, onEdit, onDelete, compact = false }) {
  if (!transactions.length) {
    return <p className="empty-state">No transactions found.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            {!compact && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.title}</strong>
                <span>{item.note}</span>
              </td>
              <td>{item.category}</td>
              <td>{item.date}</td>
              <td>
                <span className={`badge ${item.type}`}>{item.type}</span>
              </td>
              <td className={item.type === "income" ? "amount-positive" : "amount-negative"}>
                {item.type === "income" ? "+" : "-"}
                {formatCurrency(item.amount)}
              </td>
              {!compact && (
                <td>
                  <div className="table-actions">
                    <button type="button" onClick={() => onEdit(item)}>
                      <FiEdit2 />
                    </button>
                    <button type="button" onClick={() => onDelete(item.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
