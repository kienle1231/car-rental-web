import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Sparkles, User, Bot, Star, MapPin } from 'lucide-react-native';
import Animated, { FadeIn, SlideInRight, SlideInLeft, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { LuxuryColors, LuxurySpacing, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import { chatAIAPI } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedCars?: any[];
  timestamp: Date;
}

const quickReplies = ["SUV", "Under $100", "Luxury cars", "Electric"];

const AIChatScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Elite Concierge. I am your personal AI assistant. How can I help you find the perfect luxury vehicle today?',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data } = await chatAIAPI(currentInput, chatHistory);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.replyText || data.reply,
        suggestedCars: data.suggestedCars || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I am experiencing some Technical difficulties. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const onQuickReply = (text: string) => {
    setInputText(text);
    // Send immediately
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PremiumPressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </PremiumPressable>
        <View style={styles.titleContainer}>
          <Sparkles size={18} color={LuxuryColors.accent} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Elite Concierge</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <Animated.View 
            key={msg.id}
            entering={msg.role === 'user' ? SlideInRight : SlideInLeft}
            style={[
              styles.messageWrapper,
              msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
            ]}
          >
            <View style={styles.messageRow}>
              {msg.role === 'assistant' && (
                <View style={styles.avatarMini}>
                  <Bot size={14} color={LuxuryColors.accent} />
                </View>
              )}
              <GlassCard style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                  {msg.content}
                </Text>
              </GlassCard>
            </View>

              {msg.suggestedCars && msg.suggestedCars.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.suggestionScroll}
                contentContainerStyle={styles.suggestionContent}
              >
                {msg.suggestedCars.map((car, idx) => (
                  <Animated.View 
                    key={`${msg.id}-${idx}`}
                    entering={FadeInDown.delay(200 + idx * 100)}
                  >
                    <PremiumPressable 
                      onPress={() => {
                        if (car.id) {
                          router.push({ pathname: '/car/[id]', params: { id: car.id } });
                        }
                      }}
                      style={styles.carCard}
                    >
                      <Image source={{ uri: car.image }} style={styles.carImage} />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                      <View style={styles.carBadge}>
                        <Star size={10} color={LuxuryColors.accent} fill={LuxuryColors.accent} />
                        <Text style={styles.carRating}>{car.rating}</Text>
                      </View>
                      <View style={styles.carInfo}>
                        <Text style={styles.carName}>{car.carName}</Text>
                        <Text style={styles.carPrice}>{Number(car.price).toLocaleString()}<Text style={styles.perDay}>/ngày</Text></Text>
                        <View style={styles.carLocRow}>
                          <MapPin size={10} color="rgba(255,255,255,0.6)" />
                          <Text style={styles.carLocText}>{car.location}</Text>
                        </View>
                        {/* Deep link label */}
                        <Text style={styles.viewDetail}>Xem chi tiết →</Text>
                      </View>
                    </PremiumPressable>
                  </Animated.View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        ))}
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={LuxuryColors.accent} />
          </View>
        )}
      </ScrollView>

      {/* Quick Replies */}
      {!loading && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.quickReplyArea}
          contentContainerStyle={styles.quickReplyRow}
        >
          {quickReplies.map((qr, i) => (
            <PremiumPressable 
              key={qr} 
              onPress={() => onQuickReply(qr)}
              style={styles.qrPill}
            >
              <Text style={styles.qrText}>{qr}</Text>
            </PremiumPressable>
          ))}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputArea}
      >
        <GlassCard style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <PremiumPressable 
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
          >
            <Send size={20} color={LuxuryColors.background} />
          </PremiumPressable>
        </GlassCard>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    marginTop: -2,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    ...LuxuryTypography.titleM,
    fontSize: 18,
    color: '#FFF',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: LuxuryColors.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    ...LuxuryTypography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: LuxuryColors.background,
    fontWeight: '600',
  },
  assistantText: {
    color: '#FFF',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 15,
    marginBottom: 20,
  },
  inputArea: {
    padding: 20,
    backgroundColor: LuxuryColors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingLeft: 20,
    borderRadius: 30,
    gap: 12,
  },
  input: {
    flex: 1,
    ...LuxuryTypography.body,
    color: '#FFF',
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LuxuryColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionScroll: {
    marginTop: 12,
    marginHorizontal: -20,
  },
  suggestionContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  carCard: {
    width: 180,
    height: 140,
    borderRadius: LuxuryRadius.lg,
    overflow: 'hidden',
    backgroundColor: LuxuryColors.card,
  },
  carImage: {
    ...StyleSheet.absoluteFillObject,
  },
  carBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  carRating: {
    ...LuxuryTypography.tiny,
    color: '#FFF',
    fontSize: 10,
  },
  carInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  carName: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 13,
  },
  carPrice: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    fontWeight: '800',
  },
  perDay: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  carLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  carLocText: {
    ...LuxuryTypography.tiny,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
  },
  quickReplyArea: {
    flexGrow: 0,
  },
  quickReplyRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  qrPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: LuxuryRadius.full,
  },
  qrText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textSecondary,
    fontWeight: '700',
  },
  viewDetail: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    marginTop: 4,
    fontWeight: '700',
    fontSize: 9,
  },
});

export default AIChatScreen;
