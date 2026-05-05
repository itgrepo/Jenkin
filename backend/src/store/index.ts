import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import globalReducer from './globalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    global: globalReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
