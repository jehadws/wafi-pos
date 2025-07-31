import { useState } from "react"

type PaymentItem = {
  method: string
  amount: number
  _id: string
}

export function usePayment(initialTotal = 0.0) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentType>("cash")
  const [screenValue, setScreenValue] = useState("0.00")
  const [discountAmount, setDiscountAmount] = useState(0.0)
  const [rawValue, setRawValue] = useState(0);
  const [confirmedPayments, setConfirmedPayments] = useState<PaymentItem[]>([])
  const paidAmount =
    confirmedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalAmount = initialTotal
  const changeAmount = paidAmount - totalAmount

  const paymentSummary: PaymentSummary = {
    total: totalAmount,
    discount: discountAmount,
    paid: paidAmount,
    change: paidAmount === 0 ? 0 : changeAmount,
  }

  const handleNumberInput = (digit: string) => {
    if (!/^\d$/.test(digit)) return; // ignore anything not 0-9

    const newRaw = rawValue * 10 + parseInt(digit, 10);
    setRawValue(newRaw);

    // Convert cents to decimal string
    const newFormatted = (newRaw / 100).toFixed(2);
    setScreenValue(newFormatted);;
  }

  const handleBackspace = () => {
    const newRaw = Math.floor(rawValue / 10);
    setRawValue(newRaw);
    setScreenValue((newRaw / 100).toFixed(2));
  }

  const handleFullPayment = () => {
    // setScreenValue(totalAmount.toFixed(2))
    // setPaidAmount(totalAmount)
    const payment: PaymentItem = {
      method: selectedPaymentMethod,
      amount: totalAmount,
      _id: new Date().getTime().toString(),
    }

    setConfirmedPayments((prev) => [...prev, payment])
    setScreenValue("0.00")
    setRawValue(0)
  }

  const handleConfirmPayment = () => {
    const amount = Number.parseFloat(screenValue)
    // const totalPaid = paidAmount + amount
    // setPaidAmount(totalPaid)
    const payment: PaymentItem = {
      method: selectedPaymentMethod,
      amount,
      _id: new Date().getTime().toString(),
    }
    setConfirmedPayments((prev) => [...prev, payment])
    setScreenValue("0.00")
    setRawValue(0)
  }

  const handleRemovePayment = (id: string) => {
    setConfirmedPayments((prev) => prev.filter((item) => item._id !== id))
  }

  return {
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    screenValue,
    paymentSummary,
    handleNumberInput,
    handleBackspace,
    handleFullPayment,
    handleConfirmPayment,
    handleRemovePayment,
    confirmedPayments,
  }
}
