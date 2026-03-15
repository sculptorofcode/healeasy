import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerModalProps {
  visible: boolean;
  value: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
  mode?: 'datetime' | 'date' | 'time';
  isDark: boolean;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Cross-platform DateTimePickerModal component
 * 
 * Handles iOS and Android differences:
 * - iOS: Uses Modal with spinner display
 * - Android: Uses native modal (no wrapper needed)
 * - Android datetime: Two-step selection (date → time)
 * 
 * @example
 * <DateTimePickerModal
 *   visible={showPicker}
 *   value={selectedDate}
 *   onDateChange={(date) => setSelectedDate(date)}
 *   onClose={() => setShowPicker(false)}
 *   mode="datetime"
 *   isDark={isDark}
 * />
 */
export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  value,
  onDateChange,
  onClose,
  mode = 'datetime',
  isDark,
  title = 'Select Date and Time',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  // State for multi-step Android datetime selection
  const [internalDate, setInternalDate] = useState(value);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  // Sync internal date when value prop changes
  useEffect(() => {
    setInternalDate(value);
    setTempDate(value);
    setShowTimePicker(false);
  }, [value]);

  const textColor = isDark ? '#fff' : '#000';

  /**
   * Handle date picker changes
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Android event.type can be 'set', 'dismissed', or 'neutral'
    if (Platform.OS === 'android') {
      // Android picker dismissed without selection
      if (event.type === 'dismissed') {
        onClose();
        return;
      }

      if (selectedDate) {
        if (mode === 'datetime') {
          // For datetime: save date, then transition to time picker
          setTempDate(selectedDate);
          setShowTimePicker(true);
        } else if (mode === 'date') {
          // For date-only: confirm and close
          onDateChange(selectedDate);
          onClose();
        }
      }
    } else {
      // iOS: Update internal state, might transition to time picker
      if (selectedDate) {
        setInternalDate(selectedDate);
        setTempDate(selectedDate);
        if (mode === 'datetime' && !showTimePicker) {
          // Transition to time picker
          setShowTimePicker(true);
        }
      }
    }
  };

  /**
   * Handle time picker changes (for datetime mode)
   */
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android picker dismissed
      if (event.type === 'dismissed') {
        onClose();
        setShowTimePicker(false);
        return;
      }

      if (selectedDate) {
        // Combine previously selected date with new time
        const combinedDate = new Date(tempDate);
        combinedDate.setHours(selectedDate.getHours());
        combinedDate.setMinutes(selectedDate.getMinutes());

        onDateChange(combinedDate);
        onClose();
        setShowTimePicker(false);
      }
    } else {
      // iOS: Update time
      if (selectedDate) {
        const combinedDate = new Date(tempDate);
        combinedDate.setHours(selectedDate.getHours());
        combinedDate.setMinutes(selectedDate.getMinutes());
        setInternalDate(combinedDate);
      }
    }
  };

  /**
   * Handle confirm button (iOS only)
   */
  const handleConfirm = () => {
    onDateChange(internalDate);
    onClose();
    setShowTimePicker(false);
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    onClose();
    setShowTimePicker(false);
  };

  // ============ ANDROID PICKER (NO MODAL) ============
  if (Platform.OS === 'android') {
    if (!visible) return null;

    // Android datetime: show time picker after date selection
    if (mode === 'datetime' && showTimePicker) {
      return (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          textColor={textColor}
        />
      );
    }

    // Show date picker for date or initial datetime step
    if (mode === 'datetime' || mode === 'date') {
      return (
        <DateTimePicker
          value={internalDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          textColor={textColor}
        />
      );
    }

    // Show time picker for time-only mode
    if (mode === 'time') {
      return (
        <DateTimePicker
          value={internalDate}
          mode="time"
          display="default"
          onChange={handleDateChange}
          textColor={textColor}
        />
      );
    }
  }

  // ============ iOS PICKER (WITH MODAL) ============
  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' },
          ]}
        >
          <View style={[styles.pickerBox, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.header}>
              <Button title={cancelText} onPress={handleCancel} color="#007AFF" />
              <Button
                title={mode === 'datetime' && showTimePicker ? 'Next' : confirmText}
                onPress={handleConfirm}
                color="#007AFF"
              />
            </View>

            {/* Date picker (shown for date or datetime) */}
            {!showTimePicker && (mode === 'date' || mode === 'datetime') && (
              <DateTimePicker
                value={internalDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor={textColor}
              />
            )}

            {/* Time picker (shown for time or datetime after date selection) */}
            {(showTimePicker || mode === 'time') && (
              <DateTimePicker
                value={internalDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor={textColor}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerBox: {
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});