// Paywall screen for subscription management
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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

type PaywallScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Paywall'>;

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
        pkg => pkg.identifier === '$rc_annual' || 
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
      // Handle "already subscribed" case - check if they're actually premium
      if (err.message?.includes('already subscribed') || err.message?.includes('already purchased') || err.userCancelled === false) {
        // Refresh subscription status first
        await refreshSubscription();
        
        // Check current subscription status
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
          // They're not actually subscribed, show error
          Alert.alert(
            'Subscription Issue',
            'There was an issue with your subscription. Please try restoring purchases or contact support.',
            [
              {
                text: 'Restore Purchases',
                onPress: async () => {
                  try {
                    await handleRestore();
                    await refreshSubscription();
                    navigation.navigate('CreateCircle');
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

            {/* Annual subscription display */}
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
                borderRadius: 20,
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
                  <View style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginBottom: 12,
                  }}>
                    <SafeText style={{ fontSize: 14, fontWeight: '600', color: '#3b82f6', textTransform: 'uppercase' }}>
                      Annual Subscription
                    </SafeText>
                  </View>
                  <SafeText style={{ fontSize: 36, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
                    {selectedPackage.product.priceString}
                  </SafeText>
                  <SafeText style={{ color: '#6b7280', fontSize: 15 }}>
                    per year {EMOJIS.BLUE_HEART}
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

          {/* Terms */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <SafeText style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              Payment will be charged to your Apple ID account at the confirmation of purchase.
              Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
            </SafeText>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PaywallScreen;
