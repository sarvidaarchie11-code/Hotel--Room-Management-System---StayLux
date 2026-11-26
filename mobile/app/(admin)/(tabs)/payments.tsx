
import React, { useEffect, useState } from 'react';
import { Segmented } from '@/components/Pickers';
import { Alert, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { PaymentRow } from '@/components/PaymentRow';
import {
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  T,
  Backdrop,
} from '@/components/ui';
import { usePaged } from '@/hooks/usePaged';
import { api, errMsg } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Payment } from '@/types';

const FILTERS = ['All', 'Submitted', 'Verified', 'Rejected'];

export default function Payments() {
  const toast = useToast();
  const [status, setStatus] = useState('Submitted');

  const {
    items,
    loading,
    error,
    refreshing,
    onRefresh,
    reload,
    loadMore,
    loadingMore,
  } = usePaged<Payment>(
    async (page) => {
      const r = await api.get<{
        payments: Payment[];
        hasMore: boolean;
      }>('/admin/payments', {
        params: {
          status: status === 'All' ? undefined : status,
          page,
          pageSize: 12,
        },
      });

      return {
        items: r.data.payments,
        hasMore: r.data.hasMore,
      };
    },
    ['payment']
  );

  useEffect(() => {
    void reload();
  }, [status, reload]);

  const pick = (s: string) => setStatus(s);

  const review = (
    p: Payment,
    verdict: 'verify' | 'reject'
  ) => {
    Alert.alert(
      verdict === 'verify' ? 'Verify payment?' : 'Reject payment?',
      verdict === 'verify'
        ? `Confirm that you received ${p.amount.toFixed(2)} via ${p.method}${
            p.transactionRef ? ` (ref ${p.transactionRef})` : ''
          }. The guest will be notified.`
        : 'The guest will be asked to submit the payment again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: verdict === 'verify' ? 'Verify' : 'Reject',
          style: verdict === 'verify' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.post(
                `/admin/payments/${p.id}/${verdict}`
              );

              toast.show(
                verdict === 'verify'
                  ? 'Payment verified'
                  : 'Payment rejected',
                verdict === 'verify' ? 'success' : 'info'
              );

              await reload();
            } catch (e) {
              Alert.alert('Failed', errMsg(e));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.ivory }}
      edges={['top']}
    >
      <Backdrop />

      <FlatList
        keyboardShouldPersistTaps="handled"
        data={items}
        keyExtractor={(p) => String(p.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <Loading compact /> : undefined
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View>
            <T v="h1" style={{ marginBottom: 8 }}>
              Payments
            </T>

            <View
              style={{
                backgroundColor: colors.goldSoft,
                borderRadius: 14,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <T v="small" color={colors.navy}>
                No payment gateway: check each GCash or bank reference
                against your records before verifying.
              </T>
            </View>

            <Segmented
              value={status}
              onChange={pick}
              options={FILTERS.map(
                (f) => [f, f] as [string, string]
              )}
            />

            {error ? (
              <ErrorBanner
                message={error}
                onRetry={reload}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : (
            <EmptyState
              title="No payments"
              hint={
                status === 'Submitted'
                  ? 'Nothing is waiting for verification.'
                  : undefined
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12, paddingTop: 6 }}>
            <PaymentRow
              payment={item}
              showBooking
              onVerify={() => review(item, 'verify')}
              onReject={() => review(item, 'reject')}
            />
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
