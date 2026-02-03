// Paywall screen for subscription management
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useSubscription } from '../hooks/useSubscription';
// Use conditional import for RevenueCat types (not available in Expo Go)
let PurchasesPackage: any = null;
try {
  PurchasesPackage = require('react-native-purchases').PurchasesPackage;
} catch (error) {
  // Type not available (e.g., in Expo Go) - use any
}

import SafeText from '../components/SafeText';
import { EMOJIS } from '../utils/emojiUtils';
import { getSubscriptionStatus } from '../lib/subscriptionService';

// Required for App Store Guideline 3.1.2 - visible on paywall
const PRIVACY_POLICY_URL = 'https://care-circle-15fd5.web.app/privacy';
const TERMS_OF_USE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// Apple-required auto-renewal disclosure (Guideline 3.1.2)
const AUTO_RENEWAL_DISCLOSURE =
  'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Account will be charged for renewal within 24 hours prior to the end of the current period.';

type PaywallScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Paywall'>;

const getPackageTitle = (pkg: any): string => {
  if (!pkg) return 'Subscription';
  const id = (pkg.identifier || '').toLowerCase();
  const type = (pkg.packageType || '').toUpperCase();
  if (id.includes('annual') || type === 'ANNUAL') return 'Annual';
  if (id.includes('monthly') || type === 'MONTHLY') return 'Monthly';
  if (id.includes('weekly') || type === 'WEEKLY') return 'Weekly';
  return pkg.identifier || 'Subscription';
};

const getPackageDuration = (pkg: any): string => {
  if (!pkg) return '—';
  const type = (pkg.packageType || '').toUpperCase();
  const id = (pkg.identifier || '').toLowerCase();
  if (type === 'ANNUAL' || id.includes('annual')) return '1 year';
  if (type === 'MONTHLY' || id.includes('monthly')) return '1 month';
  if (type === 'WEEKLY' || id.includes('weekly')) return '1 week';
  return '—';
};

const openExternalLink = async (url: string): Promise<void> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open link', 'This link cannot be opened.');
    }
  } catch {
    Alert.alert('Unable to open link', 'This link cannot be opened.');
  }
};

const getPackagePrice = (pkg: any): string => {
  if (!pkg?.product) return '—';
  const price = (pkg.product.localizedPriceString ?? pkg.product.priceString) || '';
  return price || '—';
};

const PaywallScreen: React.FC = () => {
  const navigation = useNavigation<PaywallScreenNavigationProp>();
  const { offerings, purchase, restore, loading, error, subscriptionStatus, FREE_CIRCLE_LIMIT, refreshSubscription } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  // Set default package when offerings load (annual only)
  useEffect(() => {
    if (offerings && offerings.availablePackages.length > 0) {
      // Prefer annual package (check for $rc_annual, annual, or ANNUAL type)
      const annualPackage = offerings.availablePackages.find(
        (pkg: any) => pkg.identifier === '$rc_annual' || 
               pkg.identifier === 'annual' || 
               pkg.packageType === 'ANNUAL'
      );
      setSelectedPackage(annualPackage || offerings.availablePackages[0]);
    }
  }, [offerings]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    try {
      setPurchasing(true);
      await purchase(selectedPackage);
      
      // Refresh subscription status to ensure it's updated
      await refreshSubscription();
      
      // Small delay to ensure subscription status is synced
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if subscription is now active
      const updatedStatus = await getSubscriptionStatus();
      
      if (updatedStatus.isPremium) {
        // Navigate to CreateCircle screen after successful purchase
        Alert.alert(
          'Success!',
          'Your subscription is now active. You can create unlimited circles!',
          [
            {
              text: 'Create Circle',
              onPress: async () => {
                // Refresh one more time before navigating to ensure UI updates
                await refreshSubscription();
                // Navigate to CreateCircle screen
                navigation.navigate('CreateCircle');
              },
            },
          ]
        );
      } else {
        // Subscription might not be active yet, but purchase succeeded
        Alert.alert(
          'Purchase Complete',
          'Your subscription purchase was successful. It may take a moment to activate.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await refreshSubscription();
                navigation.navigate('CreateCircle');
              },
            },
          ]
        );
      }
    } catch (err: any) {
      // Handle "already subscribed" case - this can happen if user is signed in with different email but same Apple ID
      // RevenueCat tracks by Apple ID, not email, so subscriptions are shared across emails for the same Apple ID
      const errorMessage = err.message || err.toString() || '';
      const isAlreadySubscribedError = 
        errorMessage.includes('already subscribed') || 
        errorMessage.includes('already purchased') ||
        errorMessage.includes('already owns') ||
        (err.userCancelled === false && errorMessage.toLowerCase().includes('subscription'));
      
      if (isAlreadySubscribedError) {
        // Refresh subscription status first to get the latest state
        await refreshSubscription();
        
        // Wait a moment for sync to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check current subscription status from RevenueCat
        const currentStatus = await getSubscriptionStatus();
        if (currentStatus.isPremium) {
          // They are actually subscribed, navigate to CreateCircle
          Alert.alert(
            'Already Subscribed',
            `You already have an active Premium subscription.${currentStatus.expirationDate ? ` It renews at ${currentStatus.expirationDate.toLocaleString()}.` : ''}`,
            [
              {
                text: 'Create Circle',
                onPress: async () => {
                  // Refresh one more time to ensure UI updates
                  await refreshSubscription();
                  navigation.navigate('CreateCircle');
                },
              },
            ]
          );
          return;
        } else {
          // They're not actually subscribed, but RevenueCat says they are
          // This might be a sync issue - try restoring purchases
          Alert.alert(
            'Subscription Detected',
            'A subscription was found on your Apple ID. Restoring purchases to activate it.',
            [
              {
                text: 'Restore Purchases',
                onPress: async () => {
                  try {
                    await handleRestore();
                    await refreshSubscription();
                    // Check again after restore
                    const statusAfterRestore = await getSubscriptionStatus();
                    if (statusAfterRestore.isPremium) {
                      navigation.navigate('CreateCircle');
                    } else {
                      Alert.alert(
                        'Subscription Not Found',
                        'No active subscription was found. Please try purchasing again or contact support.',
                        [{ text: 'OK' }]
                      );
                    }
                  } catch (restoreError) {
                    // Error already handled in handleRestore
                  }
                },
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ]
          );
          return;
        }
      }
      
      if (err.message === 'Purchase was cancelled') {
        // User cancelled, don't show error
        return;
      }
      
      Alert.alert('Error', err.message || 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      await restore();
      if (subscriptionStatus.isPremium) {
        Alert.alert(
          'Restored!',
          'Your subscription has been restored.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find any active subscriptions to restore.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: string) => {
    return price;
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-blue-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          backgroundColor: '#ffffff',
          paddingHorizontal: 24,
          paddingTop: 50,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <SafeText style={{ color: '#374151', fontSize: 18, fontWeight: 'bold' }}>←</SafeText>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <SafeText style={{ fontSize: 22, marginTop: 20, fontWeight: 'bold', color: '#1f2937' }}>
                Upgrade to Premium {EMOJIS.BLUE_HEART}
              </SafeText>
              <SafeText style={{ color: '#6b7280', marginTop: 4, fontSize: 15 }}>
                Create unlimited circles for all your loved ones
              </SafeText>
            </View>
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }}>
          {/* Free tier info */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#dbeafe',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <SafeText style={{ fontSize: 20 }}>{EMOJIS.PEOPLE}</SafeText>
              </View>
              <SafeText style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                Free Plan
              </SafeText>
            </View>
            <SafeText style={{ color: '#6b7280', fontSize: 15, lineHeight: 22 }}>
              • {FREE_CIRCLE_LIMIT} circle included {EMOJIS.BLUE_HEART}
            </SafeText>
            <SafeText style={{ color: '#6b7280', fontSize: 15, lineHeight: 22, marginTop: 8 }}>
              • All core features to stay connected
            </SafeText>
          </View>

          {/* Premium features */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: 32,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 2,
            borderColor: '#60a5fa',
          }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <LinearGradient
                colors={['#60a5fa', '#a78bfa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                  shadowColor: '#60a5fa',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <SafeText style={{ color: '#ffffff', fontSize: 36 }}>{EMOJIS.BLUE_HEART}</SafeText>
              </LinearGradient>
              <SafeText style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
                Premium Plan
              </SafeText>
              <SafeText style={{ color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                Support all your loved ones with unlimited circles
              </SafeText>
            </View>

            <View style={{ gap: 16, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#dbeafe',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <SafeText style={{ fontSize: 16, color: '#3b82f6' }}>{EMOJIS.CHECKMARK}</SafeText>
                </View>
                <SafeText style={{ color: '#1f2937', fontSize: 15, flex: 1, lineHeight: 22 }}>
                  Unlimited circles for all your family members
                </SafeText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#dbeafe',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <SafeText style={{ fontSize: 16, color: '#3b82f6' }}>{EMOJIS.CHECKMARK}</SafeText>
                </View>
                <SafeText style={{ color: '#1f2937', fontSize: 15, flex: 1, lineHeight: 22 }}>
                  All premium features to stay connected
                </SafeText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#dbeafe',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <SafeText style={{ fontSize: 16, color: '#3b82f6' }}>{EMOJIS.CHECKMARK}</SafeText>
                </View>
                <SafeText style={{ color: '#1f2937', fontSize: 15, flex: 1, lineHeight: 22 }}>
                  Priority support when you need help
                </SafeText>
              </View>
            </View>

            {/* Subscription info (Guideline 3.1.2): title, duration, price */}
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="large" color="#60a5fa" />
                <SafeText style={{ color: '#6b7280', marginTop: 12, fontSize: 15 }}>
                  Loading subscription...
                </SafeText>
              </View>
            ) : selectedPackage ? (
              <View style={{
                backgroundColor: '#eff6ff',
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: '#60a5fa',
                shadowColor: '#60a5fa',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <SafeText style={{ fontSize: 14, fontWeight: '600', color: '#3b82f6', textTransform: 'uppercase', marginBottom: 8 }}>
                    {getPackageTitle(selectedPackage)} Subscription
                  </SafeText>
                  <SafeText style={{ color: '#6b7280', fontSize: 15, marginBottom: 8 }}>
                    Duration: {getPackageDuration(selectedPackage)}
                  </SafeText>
                  <SafeText style={{ fontSize: 36, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
                    {getPackagePrice(selectedPackage)}
                  </SafeText>
                  <SafeText style={{ color: '#6b7280', fontSize: 15 }}>
                    {getPackageDuration(selectedPackage) === '—'
                      ? 'See App Store for duration'
                      : `per ${getPackageDuration(selectedPackage).replace('1 ', '')} ${EMOJIS.BLUE_HEART}`}
                  </SafeText>
                </View>
              </View>
            ) : (
              <View style={{ paddingVertical: 24 }}>
                <SafeText style={{ color: '#6b7280', fontSize: 15, textAlign: 'center' }}>
                  Subscription is not available at this time. Please try again later.
                </SafeText>
              </View>
            )}

            {/* Purchase button */}
            {selectedPackage && (
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={purchasing || loading}
                style={{
                  opacity: purchasing || loading ? 0.7 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <LinearGradient
                  colors={purchasing || loading ? ['#93c5fd', '#c4b5fd'] : ['#60a5fa', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <SafeText style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                      Subscribe Now
                    </SafeText>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Apple-required auto-renewal disclosure (Guideline 3.1.2) - only when a package is selected and not loading */}
            {selectedPackage && !loading && (
              <View style={{
                marginTop: 20,
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: '#f9fafb',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#f3f4f6',
              }}>
                <SafeText style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  {AUTO_RENEWAL_DISCLOSURE}
                </SafeText>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View style={{ marginTop: 16, padding: 12, backgroundColor: '#fee2e2', borderRadius: 12 }}>
                <SafeText style={{ color: '#dc2626', fontSize: 14, textAlign: 'center' }}>
                  {error}
                </SafeText>
              </View>
            )}

            {/* Restore purchases */}
            <TouchableOpacity
              onPress={handleRestore}
              disabled={purchasing}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: purchasing ? 0.7 : 1,
              }}
            >
              <SafeText style={{ color: '#60a5fa', fontSize: 15, fontWeight: '600' }}>
                Restore Purchases
              </SafeText>
            </TouchableOpacity>
          </View>

          {/* Privacy Policy & Terms of Use (EULA) - visible, tappable links (Guideline 3.1.2), CareCircle design */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            paddingVertical: 16,
            paddingHorizontal: 24,
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#f3f4f6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <TouchableOpacity
              onPress={() => openExternalLink(PRIVACY_POLICY_URL)}
              activeOpacity={0.7}
            >
              <SafeText style={{ color: '#60a5fa', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' }}>
                Privacy Policy
              </SafeText>
            </TouchableOpacity>
            <SafeText style={{ color: '#9ca3af', fontSize: 15 }}>•</SafeText>
            <TouchableOpacity
              onPress={() => openExternalLink(TERMS_OF_USE_EULA_URL)}
              activeOpacity={0.7}
            >
              <SafeText style={{ color: '#60a5fa', fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' }}>
                Terms of Use (EULA)
              </SafeText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PaywallScreen;
