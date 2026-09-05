import { ordersApi } from '@/api';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export function useOrder(orderId: number | null) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const fetch = async () => {
        if (!orderId) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
            const data = await ordersApi.get(orderId, { signal: controller.signal });
            setOrder(data);
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        abortRef.current?.abort();
        setOrder(null);
    };

    useEffect(() => {
        if (!orderId) {
            setOrder(null);
            return;
        }
        fetch();

        return () => {
            abortRef.current?.abort();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    return { order, loading, refetch: fetch, clear };
}
