import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    useColorScheme as getSystemColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { visitFormSchema } from '../../utils/validation';
import { useVisitStore } from '../../store/visitStore';
import { OutcomeStatus } from '../../types';
import { useEffectiveColorScheme } from '../../store/themeStore';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';

const defaultDate = new Date();

type VisitForm = {
    customerName: string;
    contactPerson: string;
    location: string;
    visitDateTime: string;
    rawNotes: string;
    outcomeStatus: OutcomeStatus;
    nextFollowUpDate: string | null;
};

export default function CreateVisitScreen() {
    const router = useRouter();
    const { createVisit } = useVisitStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const systemColorScheme = getSystemColorScheme();
    const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
    const isDark = effectiveColorScheme === 'dark';
    const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
    const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<VisitForm>({
        resolver: zodResolver(visitFormSchema),
        defaultValues: {
            outcomeStatus: 'pending',
            nextFollowUpDate: null,
        },
    });

    const outcomeStatus = watch('outcomeStatus');

    const onSubmit = async (data: VisitForm) => {
        setIsSubmitting(true);
        try {
            await createVisit({ ...data, aiSummary: null });
            router.replace('/(visits)');
        } catch (error) {
            Alert.alert('Error', 'Failed to create visit');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[effectiveColorScheme].background }]}>
            <View style={[styles.headerBar, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa', borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors[effectiveColorScheme].text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: Colors[effectiveColorScheme].text }]}>New Visit</Text>
                    <Text style={[styles.headerSubtitle, { color: isDark ? '#999' : '#666' }]}>Log a new customer visit</Text>
                </View>
            </View>
            <ScrollView style={[styles.container, { backgroundColor: Colors[effectiveColorScheme].background }]}>
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Customer Name *</Text>
                        <Controller
                            control={control}
                            name="customerName"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                            color: Colors[effectiveColorScheme].text,
                                            borderColor: isDark ? '#444' : '#ddd',
                                        },
                                    ]}
                                    placeholder="Enter customer name"
                                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                        {errors.customerName && (
                            <Text style={styles.errorText}>{errors.customerName.message}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Contact Person *</Text>
                        <Controller
                            control={control}
                            name="contactPerson"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                            color: Colors[effectiveColorScheme].text,
                                            borderColor: isDark ? '#444' : '#ddd',
                                        },
                                    ]}
                                    placeholder="Enter contact person"
                                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                        {errors.contactPerson && (
                            <Text style={styles.errorText}>{errors.contactPerson.message}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Location *</Text>
                        <Controller
                            control={control}
                            name="location"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                            color: Colors[effectiveColorScheme].text,
                                            borderColor: isDark ? '#444' : '#ddd',
                                        },
                                    ]}
                                    placeholder="Enter location"
                                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                        {errors.location && (
                            <Text style={styles.errorText}>{errors.location.message}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Visit Date/Time *</Text>
                        <Controller
                            control={control}
                            name="visitDateTime"
                            render={({ field: { value } }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.dateButton,
                                        {
                                            backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                            borderColor: isDark ? '#444' : '#ddd',
                                        },
                                    ]}
                                    onPress={() => setShowVisitDatePicker(true)}
                                >
                                    <Text style={{ color: Colors[effectiveColorScheme].text }}>
                                        {value ? dayjs(value).format('MMM D, YYYY h:mm A') : 'Select date and time'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                        {errors.visitDateTime && (
                            <Text style={styles.errorText}>{errors.visitDateTime.message}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Meeting Notes *</Text>
                        <Controller
                            control={control}
                            name="rawNotes"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        {
                                            backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                            color: Colors[effectiveColorScheme].text,
                                            borderColor: isDark ? '#444' : '#ddd',
                                        },
                                    ]}
                                    placeholder="Enter detailed meeting notes"
                                    placeholderTextColor={isDark ? '#999' : '#aaa'}
                                    value={value}
                                    onChangeText={onChange}
                                    multiline
                                    numberOfLines={4}
                                />
                            )}
                        />
                        {errors.rawNotes && (
                            <Text style={styles.errorText}>{errors.rawNotes.message}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Outcome Status *</Text>
                        <Controller
                            control={control}
                            name="outcomeStatus"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.pickerContainer}>
                                    {(['deal_closed', 'follow_up_needed', 'no_interest', 'pending'] as const).map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[
                                                styles.option,
                                                {
                                                    backgroundColor: value === status ? '#007AFF' : (isDark ? '#2a2a2a' : '#fff'),
                                                    borderColor: value === status ? '#007AFF' : (isDark ? '#444' : '#ddd'),
                                                },
                                            ]}
                                            onPress={() => onChange(status)}
                                        >
                                            <Text style={[styles.optionText, { color: value === status ? '#fff' : Colors[effectiveColorScheme].text }]}>
                                                {status.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        />
                        {errors.outcomeStatus && (
                            <Text style={styles.errorText}>{errors.outcomeStatus.message}</Text>
                        )}
                    </View>

                    {outcomeStatus === 'follow_up_needed' && (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: Colors[effectiveColorScheme].text }]}>Next Follow-up Date *</Text>
                            <Controller
                                control={control}
                                name="nextFollowUpDate"
                                render={({ field: { value } }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.dateButton,
                                            {
                                                backgroundColor: isDark ? '#2a2a2a' : '#fff',
                                                borderColor: isDark ? '#444' : '#ddd',
                                            },
                                        ]}
                                        onPress={() => setShowFollowUpDatePicker(true)}
                                    >
                                        <Text style={{ color: Colors[effectiveColorScheme].text }}>
                                            {value ? dayjs(value).format('MMM D, YYYY') : 'Select follow-up date'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                            {errors.nextFollowUpDate && (
                                <Text style={styles.errorText}>{errors.nextFollowUpDate.message}</Text>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Create Visit</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <DateTimePickerModal
                visible={showVisitDatePicker}
                value={watch('visitDateTime') ? new Date(watch('visitDateTime')) : defaultDate}
                onDateChange={(date) => setValue('visitDateTime', date.toISOString())}
                onClose={() => setShowVisitDatePicker(false)}
                mode="datetime"
                isDark={isDark}
                title="Select Visit Date and Time"
            />
            <DateTimePickerModal
                visible={showFollowUpDatePicker}
                value={watch('nextFollowUpDate') != null ? new Date(watch('nextFollowUpDate')!) : defaultDate}
                onDateChange={(date) => setValue('nextFollowUpDate', date.toISOString())}
                onClose={() => setShowFollowUpDatePicker(false)}
                mode="date"
                isDark={isDark}
                title="Select Follow-up Date"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    form: {
        padding: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    dateButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    option: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    optionText: {
        fontSize: 14,
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 14,
        marginTop: 4,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});