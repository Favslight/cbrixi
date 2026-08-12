import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { BottomNav } from '../components/BottomNav';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenPreloader } from '../components/ScreenPreloader';
import { TextField } from '../components/TextField';
import { colors, gradients } from '../constants/theme';
import {
  deleteUserAccount,
  fetchUserProfile,
  logoutUser,
  updateUserProfile,
  type ProfileResponse,
} from '../services/auth';
import {
  fetchMyReferrals,
  requestReferralPayout,
  type PayoutForm,
  type ReferralData,
  type ReferralPagination,
  type ReferredUser,
} from '../services/referrals';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';
import { toErrorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

type ProfileForm = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
};

const SESSION_STORAGE_KEYS = [
  storage.keys.userToken,
  storage.keys.adminToken,
  storage.keys.userData,
  storage.keys.adminName,
  storage.keys.favoriteProducts,
];

function toNaira(value: string | number | undefined | null) {
  return `₦${Number(value ?? 0).toLocaleString()}`;
}

export function ProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [formData, setFormData] = useState<ProfileForm>({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [pagination, setPagination] = useState<ReferralPagination | null>(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralError, setReferralError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState('');
  const [payoutForm, setPayoutForm] = useState<PayoutForm>({
    account_name: '',
    account_number: '',
    bank_name: '',
  });
  const [copyMsg, setCopyMsg] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  const loadProfile = useCallback(async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      navigation.replace('Login');
      return;
    }

    const user = await fetchUserProfile(token);
    setProfile(user);
    setFormData({
      firstname: user.firstname ?? '',
      lastname: user.lastname ?? '',
      username: user.username ?? '',
      email: user.email ?? '',
    });
    await storage.setString(storage.keys.userData, JSON.stringify(user));
  }, [navigation]);

  const loadReferrals = useCallback(async (offset = 0, append = false) => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) return;

    if (offset === 0) setReferralLoading(true);
    else setLoadingMore(true);

    try {
      const data = await fetchMyReferrals(token, offset);
      setReferral(data);
      setReferredUsers((prev) =>
        append ? [...prev, ...(data.referred_users || [])] : data.referred_users || [],
      );
      setPagination(data.referred_users_pagination ?? null);
      setReferralError('');
    } catch (fetchError) {
      setReferralError(toErrorMessage(fetchError, 'Failed to load referrals'));
      if (!append) {
        setReferral(null);
        setReferredUsers([]);
        setPagination(null);
      }
    } finally {
      setReferralLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadAll = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        await Promise.all([loadProfile(), loadReferrals(0, false)]);
      } catch (fetchError) {
        setError(toErrorMessage(fetchError, 'Failed to load profile'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadProfile, loadReferrals],
  );

  useFocusEffect(
    useCallback(() => {
      loadAll().catch(() => undefined);
    }, [loadAll]),
  );

  const handleUpdate = async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (!token) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const user = await updateUserProfile(token, formData);
      setProfile(user);
      setFormData({
        firstname: user.firstname ?? formData.firstname,
        lastname: user.lastname ?? formData.lastname,
        username: user.username ?? formData.username,
        email: user.email ?? formData.email,
      });
      await storage.setString(storage.keys.userData, JSON.stringify(user));
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (updateError) {
      setError(toErrorMessage(updateError, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const token = await storage.getString(storage.keys.userToken);
    if (token) {
      await logoutUser(token);
    }
    await storage.multiRemove(SESSION_STORAGE_KEYS);
    navigation.replace('Login');
  };

  const closeDeleteModal = () => {
    if (deletingAccount) return;
    setDeleteModalVisible(false);
    setDeleteConfirmation('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim() !== 'DELETE' || deletingAccount) return;

    const token = await storage.getString(storage.keys.userToken);
    if (!token) {
      await storage.multiRemove(SESSION_STORAGE_KEYS);
      navigation.replace('Login');
      return;
    }

    setDeletingAccount(true);
    setError('');
    setSuccess('');
    try {
      await deleteUserAccount(token);
      setDeleteModalVisible(false);
      setDeleteConfirmation('');
      await storage.multiRemove(SESSION_STORAGE_KEYS);
      navigation.replace('Login');
    } catch (deleteError) {
      const status =
        deleteError && typeof deleteError === 'object' && 'status' in deleteError
          ? Number((deleteError as { status?: number }).status)
          : undefined;

      if (status === 401 || status === 404) {
        await storage.multiRemove(SESSION_STORAGE_KEYS);
        setDeleteModalVisible(false);
        setDeleteConfirmation('');
        navigation.replace('Login');
        return;
      }

      setError(toErrorMessage(deleteError, 'Unable to delete account'));
    } finally {
      setDeletingAccount(false);
    }
  };

  const handlePayoutSubmit = async () => {
    if (!referral || Number(referral.stats.available_balance) <= 0) return;
    const token = await storage.getString(storage.keys.userToken);
    if (!token) return;

    setPayoutLoading(true);
    setPayoutMsg('');
    try {
      const result = await requestReferralPayout(token, payoutForm);
      const amount = result.amount ?? referral.stats.available_balance;
      setPayoutMsg(`Payout request pending — ${toNaira(amount)} submitted.`);
      setPayoutForm({ account_name: '', account_number: '', bank_name: '' });
      await loadReferrals(0, false);
    } catch (payoutError) {
      setPayoutMsg(toErrorMessage(payoutError, 'Payout request failed.'));
    } finally {
      setPayoutLoading(false);
    }
  };

  const referralLink =
    referral?.referral_link ||
    (referral?.referral_code ? `https://cbrixi.com/signup?ref=${referral.referral_code}` : '');

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await Clipboard.setStringAsync(referralLink);
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('Copy failed');
      setTimeout(() => setCopyMsg(''), 2000);
    }
  };

  const shareLink = async () => {
    if (!referral || !referralLink) return;
    try {
      await Share.share({
        title: 'Join CBRIXI',
        message: `Sign up on CBRIXI with my referral code ${referral.referral_code}\n${referralLink}`,
        url: referralLink,
      });
      setShareMsg('Shared!');
      setTimeout(() => setShareMsg(''), 2000);
    } catch {
      // user cancelled
    }
  };

  const handleLoadMore = () => {
    if (!pagination?.has_more || loadingMore) return;
    loadReferrals(pagination.offset + pagination.limit, true).catch(() => undefined);
  };

  if (loading && !profile) {
    return <ScreenPreloader message="Loading profile..." />;
  }

  const initial = (profile?.firstname || profile?.username || 'U').charAt(0).toUpperCase();
  const available = Number(referral?.stats.available_balance ?? 0);
  const totalInvited = referral?.referral_count ?? referral?.stats.total_referred ?? 0;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={colors.primary} />
            }
          >
            <View style={styles.topBar}>
              <Pressable onPress={() => navigation.navigate('Home')} style={styles.backButton}>
                <Ionicons name="home-outline" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.topBarSpacer} />
            </View>

            <View style={styles.card}>
            <View style={styles.identityRow}>
              <LinearGradient colors={gradients.logoTile} style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
              <View style={styles.identityText}>
                <Text style={styles.name}>
                  {profile?.firstname} {profile?.lastname}
                </Text>
                <Text style={styles.username}>@{profile?.username}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.secondaryBtnText}>View Orders</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => {
                  setIsEditing((prev) => !prev);
                  setError('');
                  setSuccess('');
                }}
              >
                <Text style={styles.secondaryBtnText}>{isEditing ? 'Cancel' : 'Edit Profile'}</Text>
              </Pressable>
              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </Pressable>
            </View>

            {!!error && <Text style={styles.errorBanner}>{error}</Text>}
            {!!success && <Text style={styles.successBanner}>{success}</Text>}

            <View style={styles.formGrid}>
              <TextField
                label="First Name"
                value={formData.firstname}
                editable={isEditing}
                onChangeText={(firstname) => setFormData((prev) => ({ ...prev, firstname }))}
              />
              <TextField
                label="Last Name"
                value={formData.lastname}
                editable={isEditing}
                onChangeText={(lastname) => setFormData((prev) => ({ ...prev, lastname }))}
              />
              <TextField
                label="Username"
                value={formData.username}
                editable={isEditing}
                autoCapitalize="none"
                onChangeText={(username) => setFormData((prev) => ({ ...prev, username }))}
              />
              <TextField
                label="Email Address"
                value={formData.email}
                editable={isEditing}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(email) => setFormData((prev) => ({ ...prev, email }))}
              />
            </View>

            {isEditing ? (
              <View style={styles.saveWrap}>
                <PrimaryButton label={saving ? 'Saving...' : 'Save Changes'} onPress={handleUpdate} loading={saving} />
              </View>
            ) : null}

            <View style={styles.referralsSection}>
              <Text style={styles.sectionTitle}>Refer & Earn</Text>

              {referralLoading && !referral ? (
                <View style={styles.centeredBlock}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.mutedText}>Loading referrals...</Text>
                </View>
              ) : referralError && !referral ? (
                <Text style={styles.errorBanner}>{referralError}</Text>
              ) : referral ? (
                <>
                  <Text style={styles.sectionSubtitle}>
                    Invite friends to CBRIXI and earn {referral.settings.bonus_percentage}% rewards on their
                    purchases.
                  </Text>
                  {!referral.settings.is_enabled ? (
                    <Text style={styles.pausedText}>Referral rewards are currently paused.</Text>
                  ) : null}

                  <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>Your Code</Text>
                    <Text style={styles.codeValue}>{referral.referral_code}</Text>
                    <Text style={styles.linkText} numberOfLines={2}>
                      {referralLink}
                    </Text>
                    <View style={styles.codeActions}>
                      <Pressable style={styles.copyBtn} onPress={copyLink}>
                        <Text style={styles.copyBtnText}>{copyMsg || 'Copy Link'}</Text>
                      </Pressable>
                      <Pressable style={styles.shareBtn} onPress={shareLink}>
                        <Text style={styles.shareBtnText}>{shareMsg || 'Share'}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.statsGrid}>
                    <StatCard title="Available" value={toNaira(available)} valueColor="#4ADE80" />
                    <StatCard title="Total Earned" value={toNaira(referral.stats.total_earned)} />
                    <StatCard
                      title="Pending Payout"
                      value={toNaira(referral.stats.pending_payout_balance)}
                      valueColor="#FACC15"
                    />
                    <StatCard
                      title="Paid Out"
                      value={toNaira(referral.stats.paid_out_balance)}
                      valueColor="#93C5FD"
                    />
                    <StatCard title="Friends Invited" value={String(totalInvited)} />
                  </View>

                  <View style={styles.subSection}>
                    <View style={styles.subSectionHeader}>
                      <Text style={styles.subSectionTitle}>Invited Friends</Text>
                      {pagination ? (
                        <Text style={styles.mutedText}>
                          {referredUsers.length} of {pagination.total}
                        </Text>
                      ) : null}
                    </View>
                    {referredUsers.length === 0 ? (
                      <Text style={styles.emptyBox}>
                        No friends invited yet. Share your link to get started!
                      </Text>
                    ) : (
                      referredUsers.map((user) => (
                        <View key={user.id} style={styles.listCard}>
                          <View style={styles.flex1}>
                            <Text style={styles.listTitle}>
                              {user.name || `${user.firstname} ${user.lastname}`}
                            </Text>
                            <Text style={styles.mutedText}>{user.email}</Text>
                            <Text style={styles.tinyMuted}>
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={styles.alignEnd}>
                            <Text style={styles.greenText}>
                              {toNaira(user.total_reward_amount)} earned
                            </Text>
                            <Text style={styles.tinyMuted}>
                              {user.reward_count} reward{user.reward_count !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                    {pagination?.has_more ? (
                      <Pressable
                        style={styles.loadMoreBtn}
                        onPress={handleLoadMore}
                        disabled={loadingMore}
                      >
                        <Text style={styles.loadMoreText}>
                          {loadingMore ? 'Loading...' : 'Load more friends'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Reward History</Text>
                    {referral.rewards.length === 0 ? (
                      <Text style={styles.emptyBox}>
                        No rewards yet. Rewards appear after your friends complete payments.
                      </Text>
                    ) : (
                      referral.rewards.map((reward) => (
                        <View key={reward.id} style={styles.listCard}>
                          <View style={styles.flex1}>
                            <Text style={styles.greenText}>+{toNaira(reward.amount)}</Text>
                            {reward.order_amount != null ? (
                              <Text style={styles.tinyMuted}>
                                From order {toNaira(reward.order_amount)}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.alignEnd}>
                            <View
                              style={[
                                styles.statusPill,
                                reward.status === 'PAID' ? styles.statusPaid : styles.statusPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusPillText,
                                  reward.status === 'PAID'
                                    ? styles.statusPaidText
                                    : styles.statusPendingText,
                                ]}
                              >
                                {reward.status || 'AVAILABLE'}
                              </Text>
                            </View>
                            {reward.created_at ? (
                              <Text style={styles.tinyMuted}>
                                {new Date(reward.created_at).toLocaleDateString()}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Request Payout</Text>
                    <View style={styles.payoutCard}>
                      <TextField
                        label="Account Name"
                        value={payoutForm.account_name}
                        onChangeText={(account_name) =>
                          setPayoutForm((prev) => ({ ...prev, account_name }))
                        }
                      />
                      <TextField
                        label="Account Number"
                        value={payoutForm.account_number}
                        keyboardType="number-pad"
                        onChangeText={(account_number) =>
                          setPayoutForm((prev) => ({ ...prev, account_number }))
                        }
                      />
                      <TextField
                        label="Bank Name"
                        value={payoutForm.bank_name}
                        onChangeText={(bank_name) =>
                          setPayoutForm((prev) => ({ ...prev, bank_name }))
                        }
                      />
                      {!!payoutMsg && <Text style={styles.payoutMsg}>{payoutMsg}</Text>}
                      {available <= 0 ? (
                        <Text style={styles.mutedText}>
                          You need an available balance to request a payout.
                        </Text>
                      ) : null}
                      <PrimaryButton
                        label={
                          payoutLoading
                            ? 'Submitting...'
                            : `Withdraw ${toNaira(available)}`
                        }
                        onPress={handlePayoutSubmit}
                        loading={payoutLoading}
                        disabled={
                          payoutLoading ||
                          available <= 0 ||
                          !payoutForm.account_name.trim() ||
                          !payoutForm.account_number.trim() ||
                          !payoutForm.bank_name.trim()
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Payout History</Text>
                    {referral.payout_requests.length === 0 ? (
                      <Text style={styles.emptyBox}>No payout requests yet</Text>
                    ) : (
                      referral.payout_requests.map((req) => (
                        <View key={req.id} style={styles.listCard}>
                          <View style={styles.flex1}>
                            <Text style={styles.listTitle}>{toNaira(req.amount)}</Text>
                            <Text style={styles.tinyMuted}>
                              {req.bank_name} - {req.account_number}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              req.status === 'PENDING' ? styles.statusPending : styles.statusPaid,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                req.status === 'PENDING'
                                  ? styles.statusPendingText
                                  : styles.statusPaidText,
                              ]}
                            >
                              {req.status}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.dangerSection}>
              <View style={styles.dangerCopy}>
                <Text style={styles.dangerTitle}>Delete account</Text>
                <Text style={styles.dangerText}>
                  Permanently delete your account and related account data.
                </Text>
              </View>
              <Pressable
                style={styles.deleteAccountBtn}
                onPress={() => {
                  setError('');
                  setSuccess('');
                  setDeleteModalVisible(true);
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#FCA5A5" />
                <Text style={styles.deleteAccountText}>Delete account</Text>
              </Pressable>
            </View>
            </View>
          </ScrollView>
          <BottomNav active="Profile" navigation={navigation} />
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent
        visible={deleteModalVisible}
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={24} color="#FCA5A5" />
            </View>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalText}>
              This will permanently delete your account and related account data. This action cannot be undone.
            </Text>
            <Text style={styles.confirmLabel}>Type DELETE to continue</Text>
            <TextInput
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              editable={!deletingAccount}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="DELETE"
              placeholderTextColor={colors.textMuted}
              style={styles.confirmInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelBtn, deletingAccount && styles.disabledBtn]}
                onPress={closeDeleteModal}
                disabled={deletingAccount}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalDeleteBtn,
                  (deleteConfirmation.trim() !== 'DELETE' || deletingAccount) && styles.disabledBtn,
                ]}
                onPress={handleDeleteAccount}
                disabled={deleteConfirmation.trim() !== 'DELETE' || deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Permanently delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppBackground>
  );
}

function StatCard({
  title,
  value,
  valueColor = colors.textPrimary,
}: {
  title: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 126,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 2,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  topBarSpacer: { width: 34 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.72)',
    padding: 16,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  identityText: { flex: 1 },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  username: {
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  secondaryBtnText: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  logoutBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    color: '#FCA5A5',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    borderRadius: 12,
    padding: 10,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
  },
  successBanner: {
    color: '#86EFAC',
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.28)',
    borderRadius: 12,
    padding: 10,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 13,
  },
  formGrid: {
    gap: 12,
  },
  saveWrap: {
    marginTop: 14,
  },
  referralsSection: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  pausedText: {
    color: '#FACC15',
    fontSize: 12,
  },
  centeredBlock: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  codeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,6,23,0.45)',
    padding: 14,
    gap: 6,
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  codeValue: {
    color: '#60A5FA',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  copyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.2)',
  },
  copyBtnText: {
    color: '#93C5FD',
    fontWeight: '600',
    fontSize: 13,
  },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  shareBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,6,23,0.4)',
    padding: 12,
  },
  statTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  subSection: {
    marginTop: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subSectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBox: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,6,23,0.35)',
  },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,6,23,0.4)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  flex1: { flex: 1 },
  alignEnd: { alignItems: 'flex-end', gap: 4 },
  listTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  greenText: {
    color: '#4ADE80',
    fontWeight: '700',
    fontSize: 13,
  },
  tinyMuted: {
    color: 'rgba(148,163,184,0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  loadMoreBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPaid: {
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  statusPending: {
    backgroundColor: 'rgba(234,179,8,0.18)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusPaidText: { color: '#4ADE80' },
  statusPendingText: { color: '#FACC15' },
  payoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,6,23,0.4)',
    padding: 14,
    gap: 12,
  },
  payoutMsg: {
    color: '#93C5FD',
    textAlign: 'center',
    fontSize: 13,
  },
  dangerSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239,68,68,0.24)',
    paddingTop: 18,
    gap: 12,
  },
  dangerCopy: {
    gap: 4,
  },
  dangerTitle: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  deleteAccountBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteAccountText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.78)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    backgroundColor: '#0F172A',
    padding: 18,
    gap: 12,
  },
  modalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.14)',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  confirmInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,6,23,0.55)',
    color: colors.textPrimary,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
