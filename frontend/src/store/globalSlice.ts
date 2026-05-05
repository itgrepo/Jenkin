import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getAcademy, getAccountTypes, getBallotAnswerTypes, getBallotGroupTypes, getBallotRequestStatuses, getBanks, getCommitteeTypes, getDegrees, getDepartments, getDirectiveTypes, getDocumentSubTypes, getDocumentTypes, getExpertMemberTypes, getGroupPositions, getOrganizations, getProductGroups, getProvince, getResponsibleGroups, getStageCodes, getSubDepartments, getSubDepartmentsByDPisId, getTitles, getYearSelect } from "@services/globalService";
import { MasterData, Province } from "@models/global";


interface GlobalState {
  loading: boolean;
  provinceList?: Province[] | null;
  titleList?: MasterData[] | null;
  bankList?: MasterData[] | null;
  accountTypeList?: MasterData[] | null;
  academyList?: MasterData[] | null;
  degreeList?: MasterData[] | null;
  yearSelectList?: MasterData[] | null;
  committeeTypeList?: MasterData[] | null;
  responsibleGroupList?: MasterData[] | null;
  productGroupList?: MasterData[] | null;
  groupPositionList?: MasterData[] | null;
  directiveTypeList?: MasterData[] | null;
  expertMemberTypeList?: MasterData[] | null;
  organizationList?: MasterData[] | null;
  departmentList?: MasterData[] | null;
  subDepartmentList?: MasterData[] | null;
  ballotAnswerTypeList?: MasterData[] | null;
  ballotGroupTypeList?: MasterData[] | null;
  ballotRequestStatusList?: MasterData[] | null;
  documentTypeList?: MasterData[] | null;
  documentSubTypeList?: MasterData[] | null;
  stageCodeList?: MasterData[] | null;
  error: string | null;
}

const initialState: GlobalState = {
  loading: false,
  provinceList: null,
  titleList: null,
  bankList: null,
  accountTypeList: null,
  academyList: null,
  degreeList: null,
  yearSelectList: null,
  committeeTypeList: null,
  responsibleGroupList: null,
  productGroupList: null,
  groupPositionList: null,
  directiveTypeList: null,
  expertMemberTypeList: null,
  organizationList: null,
  departmentList: null,
  subDepartmentList: null,
  ballotAnswerTypeList: null,
  ballotGroupTypeList: null,
  ballotRequestStatusList: null,
  stageCodeList: null,
  documentTypeList: null,
  documentSubTypeList: null,
  error: null,
};

// Async Thunk
export const fetchAppProvince = createAsyncThunk(
  "setting/fetchAppProvince",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getProvince();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunk
export const fetchAppTitles = createAsyncThunk(
  "setting/fetchAppTitles",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getTitles();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunk
export const fetchAppBanks = createAsyncThunk(
  "setting/fetchAppBanks",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getBanks();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppAccountTypes = createAsyncThunk(
  "setting/fetchAppAccountTypes",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getAccountTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppAcademy = createAsyncThunk(
  "setting/fetchAppAcademy",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getAcademy();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppDegree = createAsyncThunk(
  "setting/fetchAppDegree",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getDegrees();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppYearSelect = createAsyncThunk(
  "setting/fetchAppYearSelect",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getYearSelect();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppCommitteeType = createAsyncThunk(
  "setting/fetchAppCommitteeType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getCommitteeTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppResponsibleGroup = createAsyncThunk(
  "setting/fetchAppResponsibleGroup",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getResponsibleGroups();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppDepartments = createAsyncThunk(
  "setting/fetchAppDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getDepartments();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppSubDepartmentsByDPisId = createAsyncThunk(
  "setting/fetchAppSubDepartmentsByDPisId",
  async (dpisId: string, { rejectWithValue }) => {
    try {
      const resp = await getSubDepartmentsByDPisId(dpisId);
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppSubDepartments = createAsyncThunk(
  "setting/fetchAppSubDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getSubDepartments();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppProductGroup = createAsyncThunk(
  "setting/fetchAppProductGroup",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getProductGroups();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppGroupPosition = createAsyncThunk(
  "setting/fetchAppGroupPosition",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getGroupPositions();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppDirectiveType = createAsyncThunk(
  "setting/fetchAppDirectiveType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getDirectiveTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppExpertMemberType = createAsyncThunk(
  "setting/fetchAppExpertMemberType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getExpertMemberTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppOrganizations = createAsyncThunk(
  "setting/fetchAppOrganizations",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getOrganizations();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppBallotAnswerType = createAsyncThunk(
  "setting/fetchAppBallotAnswerType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getBallotAnswerTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppBallotGroupType = createAsyncThunk(
  "setting/fetchAppBallotGroupType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getBallotGroupTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppBallotRequestStatus = createAsyncThunk(
  "setting/fetchAppBallotRequestStatus",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getBallotRequestStatuses();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    } 
  }
);

export const fetchAppStageCode = createAsyncThunk(
  "setting/fetchAppStageCode",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getStageCodes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppDocumentType = createAsyncThunk(
  "setting/fetchAppDocumentType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getDocumentTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppDocumentSubType = createAsyncThunk(
  "setting/fetchAppDocumentSubType",
  async (_, { rejectWithValue }) => {
    try {
      const resp = await getDocumentSubTypes();
      return resp;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppProvince.fulfilled, (state, action) => {
        state.provinceList = action.payload || null;
      })
      .addCase(fetchAppProvince.rejected, (state, action) => {
        state.provinceList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppTitles.fulfilled, (state, action) => {
        state.titleList = action.payload || null;
      })
      .addCase(fetchAppTitles.rejected, (state, action) => {
        state.titleList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppBanks.fulfilled, (state, action) => {
        state.bankList = action.payload || null;
      })
      .addCase(fetchAppBanks.rejected, (state, action) => {
        state.bankList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppAccountTypes.fulfilled, (state, action) => {
        state.accountTypeList = action.payload || null;
      })
      .addCase(fetchAppAccountTypes.rejected, (state, action) => {
        state.accountTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppAcademy.fulfilled, (state, action) => {
        state.academyList = action.payload || null;
      })
      .addCase(fetchAppAcademy.rejected, (state, action) => {
        state.academyList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppDegree.fulfilled, (state, action) => {
        state.degreeList = action.payload || null;
      })
      .addCase(fetchAppDegree.rejected, (state, action) => {
        state.degreeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppYearSelect.fulfilled, (state, action) => {
        state.yearSelectList = action.payload || null;
      })
      .addCase(fetchAppYearSelect.rejected, (state, action) => {
        state.yearSelectList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppCommitteeType.fulfilled, (state, action) => {
        state.committeeTypeList = action.payload || null;
      })
      .addCase(fetchAppCommitteeType.rejected, (state, action) => {
        state.committeeTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppResponsibleGroup.fulfilled, (state, action) => {
        state.responsibleGroupList = action.payload || null;
      })
      .addCase(fetchAppResponsibleGroup.rejected, (state, action) => {
        state.responsibleGroupList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppProductGroup.fulfilled, (state, action) => {
        state.productGroupList = action.payload || null;
      })
      .addCase(fetchAppProductGroup.rejected, (state, action) => {
        state.productGroupList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppGroupPosition.fulfilled, (state, action) => {
        state.groupPositionList = action.payload || null;
      })
      .addCase(fetchAppGroupPosition.rejected, (state, action) => {
        state.groupPositionList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppDirectiveType.fulfilled, (state, action) => {
        state.directiveTypeList = action.payload || null;
      })
      .addCase(fetchAppDirectiveType.rejected, (state, action) => {
        state.directiveTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppExpertMemberType.fulfilled, (state, action) => {
        state.expertMemberTypeList = action.payload || null;
      })
      .addCase(fetchAppExpertMemberType.rejected, (state, action) => {
        state.expertMemberTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppOrganizations.fulfilled, (state, action) => {
        state.organizationList = action.payload || null;
      })
      .addCase(fetchAppOrganizations.rejected, (state, action) => {
        state.organizationList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppDepartments.fulfilled, (state, action) => {
        state.departmentList = action.payload || null;
      })
      .addCase(fetchAppDepartments.rejected, (state, action) => {
        state.departmentList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppSubDepartmentsByDPisId.fulfilled, (state, action) => {
        state.subDepartmentList = action.payload || null;
      })
      .addCase(fetchAppSubDepartmentsByDPisId.rejected, (state, action) => {
        state.subDepartmentList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppSubDepartments.fulfilled, (state, action) => {
        state.subDepartmentList = action.payload || null;
      })
      .addCase(fetchAppSubDepartments.rejected, (state, action) => {
        state.subDepartmentList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppBallotAnswerType.fulfilled, (state, action) => {
        state.ballotAnswerTypeList = action.payload || null;
      })
      .addCase(fetchAppBallotAnswerType.rejected, (state, action) => {
        state.ballotAnswerTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppBallotGroupType.fulfilled, (state, action) => {
        state.ballotGroupTypeList = action.payload || null;
      })
      .addCase(fetchAppBallotGroupType.rejected, (state, action) => {
        state.ballotGroupTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppBallotRequestStatus.fulfilled, (state, action) => {
        state.ballotRequestStatusList = action.payload || null;
      })
      .addCase(fetchAppBallotRequestStatus.rejected, (state, action) => {
        state.ballotRequestStatusList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppStageCode.fulfilled, (state, action) => {
        state.stageCodeList = action.payload || null;
      })
      .addCase(fetchAppStageCode.rejected, (state, action) => {
        state.stageCodeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppDocumentType.fulfilled, (state, action) => {
        state.documentTypeList = action.payload || null;
      })
      .addCase(fetchAppDocumentType.rejected, (state, action) => {
        state.documentTypeList = null;
        state.error = action.payload as string;
      })
      .addCase(fetchAppDocumentSubType.fulfilled, (state, action) => {
        state.documentSubTypeList = action.payload || null;
      })
      .addCase(fetchAppDocumentSubType.rejected, (state, action) => {
        state.documentSubTypeList = null;
        state.error = action.payload as string;
      });
  },
});

export const { setGlobalLoading } = globalSlice.actions;
export default globalSlice.reducer;
