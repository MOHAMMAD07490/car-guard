import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';

export interface CustomAlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: CustomAlertButton[];
}

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  buttons = [],
}: CustomAlertProps) {
  const { colors } = useAppTheme();

  const handleClose = () => {
    onClose();
  };

  const alertButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: handleClose }];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          <View style={[styles.buttonRow, { borderTopColor: colors.border }]}>
            {alertButtons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              let textColor = colors.primary;
              if (isDestructive) textColor = colors.danger;
              else if (isCancel) textColor = colors.textSecondary;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.button,
                    idx > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border },
                  ]}
                  onPress={() => {
                    btn.onPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: textColor },
                      (isDestructive || !isCancel) && { fontWeight: '700' },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.card,
  },
  title: {
    fontSize: FontSize.md + 1,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.xs + 2,
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: FontSize.sm,
  },
});
