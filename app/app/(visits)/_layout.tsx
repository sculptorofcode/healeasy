import { Stack } from 'expo-router';

export default function VisitsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Visits' }} />
      <Stack.Screen name="create" options={{ title: 'Create Visit' }} />
      <Stack.Screen name="[id]" options={{ title: 'Visit Details' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Visit' }} />
    </Stack>
  );
}
