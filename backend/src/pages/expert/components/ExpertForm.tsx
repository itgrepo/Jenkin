import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Tabs,
  Tab,
  Autocomplete,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import { Upload, Download, Delete, Add } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {  MasterData } from "@models/global";
import {
  fetchAppAcademy,
  fetchAppAccountTypes,
  fetchAppBanks,
  fetchAppDegree,
  fetchAppProvince,
  fetchAppTitles,
  fetchAppYearSelect,
  setGlobalLoading,
} from "@store/globalSlice";
import { downloadFile, uploadFileServer } from "@utils/fileService";
import { getMinioFullUrl } from "@utils/index";
import { useValidateFile } from "@hooks/validateFile";
import { showWarning } from "@components/Swal";
import {
  EducationData,
  TrainingData,
  WorkExperienceData,
  BankAccountData,
  Expert,
} from "@models/expert";
import { grey } from "@mui/material/colors";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expert-tabpanel-${index}`}
      aria-labelledby={`expert-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ExpertFormProps {
  formData: Expert;
  isReadOnly: boolean;
  mode: "add" | "edit" | "view";
  onFormDataChange: (field: string, value: any) => void;
  onUseIdCardAddress: (checked: boolean) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  onEducationListChange?: (list: EducationData[]) => void;
  onTrainingListChange?: (list: TrainingData[]) => void;
  onWorkExperienceListChange?: (list: WorkExperienceData[]) => void;
  onBankAccountListChange?: (list: BankAccountData[]) => void;
  initialEducationList?: EducationData[];
  initialTrainingList?: TrainingData[];
  initialWorkExperienceList?: WorkExperienceData[];
  initialBankAccountList?: BankAccountData[];
}

export default function ExpertForm({
  formData,
  isReadOnly,
  mode,
  onFormDataChange,
  // onUseIdCardAddress,
  onFileChange,
  selectedFile,
  onEducationListChange,
  onTrainingListChange,
  onWorkExperienceListChange,
  onBankAccountListChange,
  initialEducationList = [],
  initialTrainingList = [],
  initialWorkExperienceList = [],
  initialBankAccountList = [],
}: ExpertFormProps) {
  const [currentTab, setCurrentTab] = useState(0);

  const {
    provinceList,
    titleList,
    bankList,
    academyList,
    degreeList,
    yearSelectList,
    accountTypeList,
  } = useAppSelector((state) => state?.global);

  const user = useAppSelector((state) => state?.auth?.user);

  const roleGroup = user?.role?.group;

  // const [districtList, setDistrictList] = useState<District[]>([]);
  // const [subDistrictList, setSubDistrictList] = useState<SubDistrict[]>([]);
  // const [subDistrictList2, setSubDistrictList2] = useState<SubDistrict[]>([]);
  // const [districtList2, setDistrictList2] = useState<District[]>([]);

  // State for education, training, work experience, bank account
  const [educationList, setEducationList] =
    useState<EducationData[]>(initialEducationList);
  const [trainingList, setTrainingList] =
    useState<TrainingData[]>(initialTrainingList);
  const [workExperienceList, setWorkExperienceList] = useState<
    WorkExperienceData[]
  >(initialWorkExperienceList);
  const [bankAccountList, setBankAccountList] = useState<BankAccountData[]>(
    initialBankAccountList
  );

  // Update parent when lists change
  useEffect(() => {
    if (onEducationListChange) {
      onEducationListChange(educationList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educationList]);

  useEffect(() => {
    if (onTrainingListChange) {
      onTrainingListChange(trainingList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingList]);

  useEffect(() => {
    if (onWorkExperienceListChange) {
      onWorkExperienceListChange(workExperienceList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workExperienceList]);

  useEffect(() => {
    if (onBankAccountListChange) {
      onBankAccountListChange(bankAccountList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankAccountList]);

  // Form states for adding new entries
  const [educationForm, setEducationForm] = useState<EducationData>({
    graduationYear: "",
    educationLevel: 0,
    institution: 0,
    qualification: "",
  });
  const [trainingForm, setTrainingForm] = useState<TrainingData>({
    details: "",
  });
  const [workExperienceForm, setWorkExperienceForm] =
    useState<WorkExperienceData>({
      startYear: "",
      endYear: "",
      details: "",
      responsibility: "",
    });
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountData>({
    bankAccountNumber: "",
    bank: 0,
    bankBranch: "",
    accountType: 0,
    status: "active",
    accountPhotoFile: "",
    ktbFile: "",
  });

  // State for bank account file uploads
  const [bankAccountPhotoFile, setBankAccountPhotoFile] = useState<File | null>(
    null
  );
  const [ktbFile, setKtbFile] = useState<File | null>(null);

  const dispatch = useAppDispatch();
  const fileValidator = useValidateFile();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // useEffect(() => {
  //   if (formData?.idCardAddress?.province) {
  //     callDistrict(formData?.idCardAddress?.province);
  //   }
  //   if (formData?.idCardAddress?.district) {
  //     callSubDistrict(
  //       formData?.idCardAddress?.province,
  //       formData?.idCardAddress?.district
  //     );
  //   }
  //   if (formData?.idCardAddress?.subDistrict) {
  //     callSubDistrict2(
  //       formData?.idCardAddress?.province,
  //       formData?.idCardAddress?.district
  //     );
  //   }
  //   if (formData?.idCardAddress?.district) {
  //     callDistrict2(formData?.idCardAddress?.province);
  //   }
  // }, []);

  useEffect(() => {
    if (!provinceList) {
      dispatch(fetchAppProvince());
    }
    if (!titleList) {
      dispatch(fetchAppTitles());
    }
    if (!bankList) {
      dispatch(fetchAppBanks());
    }
    if (!academyList) {
      dispatch(fetchAppAcademy());
    }
    if (!degreeList) {
      dispatch(fetchAppDegree());
    }
    if (!yearSelectList) {
      dispatch(fetchAppYearSelect());
    }
    if (!accountTypeList) {
      dispatch(fetchAppAccountTypes());
    }
  }, [
    dispatch,
    provinceList,
    titleList,
    bankList,
    academyList,
    degreeList,
    yearSelectList,
    accountTypeList,
  ]);

  // const callSubDistrict = async (province: number, district: number) => {
  //   try {
  //     dispatch(setGlobalLoading(true));
  //     const res = await getSubDistrict(province, district);
  //     setSubDistrictList(res);
  //   } catch (error) {
  //     // console.error("Load dashboard failed:", error);
  //   } finally {
  //     dispatch(setGlobalLoading(false));
  //   }
  // };

  // const callDistrict = async (province: number) => {
  //   try {
  //     dispatch(setGlobalLoading(true));
  //     const res = await getDistrict(province);
  //     setDistrictList(res);
  //   } catch (error) {
  //     // console.error("Load dashboard failed:", error);
  //   } finally {
  //     dispatch(setGlobalLoading(false));
  //   }
  // };

  // const callSubDistrict2 = async (province: number, district: number) => {
  //   try {
  //     dispatch(setGlobalLoading(true));
  //     const res = await getSubDistrict(province, district);
  //     setSubDistrictList2(res);
  //   } catch (error) {
  //     // console.error("Load dashboard failed:", error);
  //   } finally {
  //     dispatch(setGlobalLoading(false));
  //   }
  // };

  // const callDistrict2 = async (province: number) => {
  //   try {
  //     dispatch(setGlobalLoading(true));
  //     const res = await getDistrict(province);
  //     setDistrictList2(res);
  //   } catch (error) {
  //     // console.error("Load dashboard failed:", error);
  //   } finally {
  //     dispatch(setGlobalLoading(false));
  //   }
  // };

  const handleDownload = async (fileUrl: string) => {
    try {
      await downloadFile(getMinioFullUrl(fileUrl));
    } catch (e) {
      console.error(e);
    } finally {
    }
  };

  // Function to extract filename from path
  const getFileName = (filePath: string): string => {
    if (!filePath) return "";
    // Extract filename from path (e.g., "expert/cv/1763924319-10-95.pdf" -> "1763924319-10-95.pdf")
    return filePath.split("/").pop() || filePath;
  };

  // Education handlers
  const handleAddEducation = () => {
    if (
      !educationForm.graduationYear ||
      !educationForm.educationLevel ||
      !educationForm.institution ||
      !educationForm.qualification
    ) {
      return;
    }
    const newEducation: EducationData = {
      id: Date.now(), // Use number instead of string
      ...educationForm,
    };
    setEducationList([...educationList, newEducation]);
    setEducationForm({
      graduationYear: "",
      educationLevel: 0,
      institution: 0,
      qualification: "",
    });
  };

  const handleDeleteEducation = (id: number | undefined) => {
    if (id === undefined) return;
    setEducationList(educationList.filter((item) => item.id !== id));
  };

  // Training handlers
  const handleAddTraining = () => {
    if (!trainingForm.details.trim()) {
      return;
    }
    const newTraining: TrainingData = {
      id: Date.now(), // Use number instead of string
      ...trainingForm,
    };
    setTrainingList([...trainingList, newTraining]);
    setTrainingForm({ details: "" });
  };

  const handleDeleteTraining = (id: number | undefined) => {
    if (id === undefined) return;
    setTrainingList(trainingList.filter((item) => item.id !== id));
  };

  // Work Experience handlers
  const handleAddWorkExperience = () => {
    if (
      !workExperienceForm.startYear ||
      !workExperienceForm.endYear ||
      !workExperienceForm.details.trim()
    ) {
      return;
    }
    const newWorkExperience: WorkExperienceData = {
      id: Date.now(), // Use number instead of string
      ...workExperienceForm,
    };
    setWorkExperienceList([...workExperienceList, newWorkExperience]);
    setWorkExperienceForm({
      startYear: "",
      endYear: "",
      details: "",
      responsibility: "",
    });
  };

  const handleDeleteWorkExperience = (id: number | undefined) => {
    if (id === undefined) return;
    setWorkExperienceList(workExperienceList.filter((item) => item.id !== id));
  };

  // Bank Account file handlers
  const handleBankAccountPhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setBankAccountPhotoFile(null);
      return;
    }
    const errorMessage = fileValidator.validate(selected);
    if (errorMessage) {
      showWarning("แจ้งเตือน", errorMessage);
      setBankAccountPhotoFile(null);
      return;
    }
    setBankAccountPhotoFile(selected);
  };

  const handleKtbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setKtbFile(null);
      return;
    }
    const errorMessage = fileValidator.validate(selected);
    if (errorMessage) {
      showWarning("แจ้งเตือน", errorMessage);
      setKtbFile(null);
      return;
    }
    setKtbFile(selected);
  };

  // Bank Account handlers
  const handleAddBankAccount = async () => {
    if (
      !bankAccountForm.bankAccountNumber.trim() ||
      !bankAccountForm.bank ||
      !bankAccountForm.bankBranch.trim()
    ) {
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      const newBankAccount: BankAccountData = {
        id: Date.now(),
        ...bankAccountForm,
      };

      // Upload account photo file if exists
      if (bankAccountPhotoFile) {
        try {
          const filename = await uploadFileServer({
            file: bankAccountPhotoFile,
            folder: "expert/bank-account",
            oldFile: newBankAccount?.accountPhotoFile || "",
          });
          if (filename) {
            newBankAccount.accountPhotoFile = filename;
          }
        } catch (error) {
          console.error("Error uploading account photo:", error);
          showWarning("แจ้งเตือน", "ไม่สามารถอัปโหลดไฟล์รูปหน้าบัญชีธนาคารได้");
        }
      }

      // Upload KTB file if exists
      if (ktbFile) {
        try {
          const filename = await uploadFileServer({
            file: ktbFile,
            folder: "expert/bank-account",
            oldFile: newBankAccount?.ktbFile || "",
          });
          if (filename) {
            newBankAccount.ktbFile = filename;
          }
        } catch (error) {
          console.error("Error uploading KTB file:", error);
          showWarning("แจ้งเตือน", "ไม่สามารถอัปโหลดไฟล์ KTB ได้");
        }
      }

      setBankAccountList([...bankAccountList, newBankAccount]);
      setBankAccountForm({
        bankAccountNumber: "",
        bank: 0,
        bankBranch: "",
        accountType: 0,
        status: "active",
        accountPhotoFile: "",
        ktbFile: "",
      });
      setBankAccountPhotoFile(null);
      setKtbFile(null);
    } catch (error) {
      console.error("Error adding bank account:", error);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleDeleteBankAccount = (id: number | undefined) => {
    if (id === undefined) return;
    setBankAccountList(bankAccountList.filter((item) => item.id !== id));
  };

  const getTitleName = (id: number) => {
    return titleList?.find((t) => t.id === id)?.name || "";
  };

  isReadOnly = roleGroup === "admin";

  return (
    <Box>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "#fff",
          boxShadow: 1,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="expert information tabs"
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              minHeight: 64,
            },
            "& .Mui-selected": {
              color: "primary.main",
            },
          }}
        >
          <Tab label="ข้อมูลส่วนตัว" />
          <Tab label="ข้อมูลการศึกษา/การทำงาน" />
          <Tab label="ที่อยู่" />
          {roleGroup === "admin" && <Tab label="บัญชีธนาคาร" />}
        </Tabs>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: "grey.50", minHeight: "60vh" }}>
        {/* Tab 1: Personal Information */}
        <TabPanel value={currentTab} index={0}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: "#fff" }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 4, color: "primary.main" }}
            >
              ข้อมูลส่วนตัว
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="เลขบัตรประชาชน"
                value={formData.idCard}
                slotProps={{ input: { readOnly: true } }}
                onChange={(e) => onFormDataChange("idCard", e.target.value)}
                required
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr 2fr" },
                  gap: 2,
                }}
              >
                {/* <Autocomplete
                  options={titleList || []}
                  getOptionLabel={(option) => option.name}
                  value={
                    titleList?.find((t) => t.id === formData.prefix) || null
                  }
                  onChange={(_, newValue) =>
                    onFormDataChange("prefix", newValue?.id || 0)
                  }
                  isOptionEqualToValue={(
                    option: MasterData,
                    value: MasterData
                  ) => option.name === value.name}
                  disabled={true}
                  size="small"
                  title="คำนำหน้า"
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="คำนำหน้า"
                      fullWidth
                      required
                    />
                  )}
                /> */}

                <TextField
                  label="คำนำหน้า"
                  size="small"
                  value={getTitleName(formData.prefix)}
                  slotProps={{ input: { readOnly: true } }}
                  required
                  sx={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => onFormDataChange("prefix", e.target.value)}
                />

                <TextField
                  label="ชื่อ"
                  size="small"
                  value={formData.firstName}
                  slotProps={{ input: { readOnly: true } }}
                  required
                  sx={{ flex: 1, minWidth: 200 }}
                  onChange={(e) =>
                    onFormDataChange("firstName", e.target.value)
                  }
                />

                <TextField
                  label="นามสกุล"
                  size="small"
                  value={formData.lastName}
                  slotProps={{ input: { readOnly: true } }}
                  required
                  sx={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => onFormDataChange("lastName", e.target.value)}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="เบอร์โทรศัพท์"
                  size="small"
                  value={formData.phone}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => onFormDataChange("phone", e.target.value)}
                />

                <TextField
                  label="โทรศัพท์มือถือ"
                  size="small"
                  value={formData.mobile}
                  slotProps={{ input: { readOnly: true } }}
                  required
                  sx={{ flex: 1, minWidth: 200 }}
                  onChange={(e) => onFormDataChange("mobile", e.target.value)}
                />
              </Box>

              <TextField
                fullWidth
                size="small"
                label="อีเมล"
                type="email"
                value={formData.email}
                slotProps={{ input: { readOnly: true } }}
                required
                onChange={(e) => onFormDataChange("email", e.target.value)}
              />
            </Box>
          </Paper>
        </TabPanel>

        {/* Tab 2: Education/Training/Work Experience */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Section 1: Education */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ข้อมูลการศึกษา
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Autocomplete
                    options={yearSelectList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      yearSelectList?.find(
                        (a) => a.name === educationForm.graduationYear
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setEducationForm({
                        ...educationForm,
                        graduationYear: newValue?.name || "",
                      })
                    }
                    isOptionEqualToValue={(
                      option: MasterData,
                      value: MasterData
                    ) => option.name === value.name}
                    disabled={isReadOnly}
                    size="small"
                    title="ปีที่จบ (พ.ศ.)"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        label="ปีที่จบ (พ.ศ.)"
                        fullWidth
                        required
                      />
                    )}
                  />

                  <Autocomplete
                    options={degreeList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      degreeList?.find(
                        (a) => a.id === educationForm.educationLevel
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setEducationForm({
                        ...educationForm,
                        educationLevel: newValue?.id || 0,
                      })
                    }
                    isOptionEqualToValue={(
                      option: MasterData,
                      value: MasterData
                    ) => option.name === value.name}
                    disabled={isReadOnly}
                    size="small"
                    title="เลือกระดับการศึกษา"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        label="เลือกระดับการศึกษา"
                        fullWidth
                        required
                      />
                    )}
                  />
                  <Autocomplete
                    options={academyList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      academyList?.find(
                        (a) => a.id === educationForm.institution
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setEducationForm({
                        ...educationForm,
                        institution: newValue?.id || 0,
                      })
                    }
                    isOptionEqualToValue={(
                      option: MasterData,
                      value: MasterData
                    ) => option.name === value.name}
                    disabled={isReadOnly}
                    size="small"
                    title="เลือกระดับการศึกษา"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        label="เลือกระดับการศึกษา"
                        fullWidth
                        required
                      />
                    )}
                  />
                  <TextField
                    label="คุณวุฒิ"
                    size="small"
                    value={educationForm.qualification}
                    onChange={(e) =>
                      setEducationForm({
                        ...educationForm,
                        qualification: e.target.value,
                      })
                    }
                    disabled={isReadOnly}
                    fullWidth
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddEducation}
                  disabled={isReadOnly}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    boxShadow: 2,
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  เพิ่มข้อมูลการศึกษา
                </Button>
              </Box>
              {educationList.length > 0 ? (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    mt: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: grey[100],
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>ปีที่จบ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ระดับการศึกษา
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          สถาบันการศึกษา
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>คุณวุฒิ</TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, width: 100 }}
                          align="center"
                        >
                          การจัดการ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {educationList.map((edu) => (
                        <TableRow key={edu.id} hover>
                          <TableCell>
                            {edu.graduationYear
                              ? `${edu.graduationYear} (พ.ศ.)`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {degreeList?.find(
                              (a) => a.id === edu.educationLevel
                            )?.name || ""}
                          </TableCell>
                          <TableCell>
                            {academyList?.find((a) => a.id === edu.institution)
                              ?.name || ""}
                          </TableCell>
                          <TableCell>{edu.qualification}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteEducation(edu.id!)}
                              disabled={isReadOnly}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "error.light",
                                  color: "#fff",
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "2px dashed",
                    borderColor: "grey.300",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    ยังไม่มีข้อมูลการศึกษา
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    กรุณาเพิ่มข้อมูลการศึกษาด้านบน
                  </Typography>
                </Box>
              )}
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Section 2: Training */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ข้อมูลการอบรม
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="รายละเอียดการอบรม"
                  value={trainingForm.details}
                  onChange={(e) =>
                    setTrainingForm({
                      ...trainingForm,
                      details: e.target.value,
                    })
                  }
                  disabled={isReadOnly}
                  multiline
                  rows={3}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddTraining}
                  disabled={isReadOnly}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    boxShadow: 2,
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  เพิ่มข้อมูลการอบรม
                </Button>
              </Box>
              {trainingList.length > 0 ? (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    mt: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: grey[100],
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>
                          รายละเอียดการอบรม
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, width: 100 }}
                          align="center"
                        >
                          การจัดการ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trainingList.map((training) => (
                        <TableRow
                          key={training.id}
                          hover
                          sx={{
                            "&:hover": {
                              backgroundColor: "action.hover",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>
                            {training.details}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTraining(training.id!)}
                              disabled={isReadOnly}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "error.light",
                                  color: "#fff",
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "2px dashed",
                    borderColor: "grey.300",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    ยังไม่มีข้อมูลการอบรม
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    กรุณาเพิ่มข้อมูลการอบรมด้านบน
                  </Typography>
                </Box>
              )}
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Section 3: Work Experience */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ข้อมูลประสบการณ์ทำงาน
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Autocomplete
                    options={yearSelectList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      yearSelectList?.find(
                        (a) => a.name === workExperienceForm.startYear
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      const newStartYear = newValue?.name || "";
                      // Reset endYear if it's less than or equal to the new startYear
                      const shouldResetEndYear =
                        workExperienceForm.endYear &&
                        (parseInt(workExperienceForm.endYear) <=
                          parseInt(newStartYear) ||
                          !newStartYear);
                      setWorkExperienceForm({
                        ...workExperienceForm,
                        startYear: newStartYear,
                        endYear: shouldResetEndYear
                          ? ""
                          : workExperienceForm.endYear,
                      });
                    }}
                    isOptionEqualToValue={(
                      option: MasterData,
                      value: MasterData
                    ) => option.name === value.name}
                    disabled={isReadOnly}
                    size="small"
                    title="ปีที่เริ่มต้น (พ.ศ.)"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        label="ปีที่เริ่มต้น (พ.ศ.)"
                        fullWidth
                        required
                      />
                    )}
                  />

                  <Autocomplete
                    options={
                      yearSelectList?.filter((option) => {
                        if (!workExperienceForm.startYear) return true;
                        const startYearNum = parseInt(
                          workExperienceForm.startYear
                        );
                        const optionYearNum = parseInt(option.name);
                        return (
                          !isNaN(startYearNum) &&
                          !isNaN(optionYearNum) &&
                          optionYearNum >= startYearNum
                        );
                      }) || []
                    }
                    getOptionLabel={(option) => option.name}
                    value={
                      yearSelectList?.find(
                        (a) => a.name === workExperienceForm.endYear
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      setWorkExperienceForm({
                        ...workExperienceForm,
                        endYear: newValue?.name || "",
                      })
                    }
                    isOptionEqualToValue={(
                      option: MasterData,
                      value: MasterData
                    ) => option.name === value.name}
                    disabled={isReadOnly || !workExperienceForm.startYear}
                    size="small"
                    title="ปีที่สิ้นสุด (พ.ศ.)"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        label="ปีที่สิ้นสุด (พ.ศ.)"
                        fullWidth
                        required
                      />
                    )}
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="รายละเอียด"
                  value={workExperienceForm.details}
                  onChange={(e) =>
                    setWorkExperienceForm({
                      ...workExperienceForm,
                      details: e.target.value,
                    })
                  }
                  disabled={isReadOnly}
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="หน้าที่ความรับผิดชอบ"
                  value={workExperienceForm.responsibility}
                  onChange={(e) =>
                    setWorkExperienceForm({
                      ...workExperienceForm,
                      responsibility: e.target.value,
                    })
                  }
                  disabled={isReadOnly}
                  multiline
                  rows={2}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddWorkExperience}
                  disabled={isReadOnly}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    boxShadow: 2,
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  เพิ่มข้อมูลประสบการณ์
                </Button>
              </Box>
              {workExperienceList.length > 0 ? (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    mt: 3,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: grey[100],
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>
                          ปีที่เริ่มต้น
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ปีที่สิ้นสุด
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          รายละเอียด
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          หน้าที่ความรับผิดชอบ
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, width: 100 }}
                          align="center"
                        >
                          การจัดการ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workExperienceList.map((exp) => (
                        <TableRow
                          key={exp.id}
                          hover
                          sx={{
                            "&:hover": {
                              backgroundColor: "action.hover",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>
                            {exp.startYear ? `${exp.startYear} (พ.ศ.)` : "-"}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {exp.endYear ? `${exp.endYear} (พ.ศ.)` : "-"}
                          </TableCell>
                          <TableCell>{exp.details}</TableCell>
                          <TableCell>{exp.responsibility}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteWorkExperience(exp.id!)
                              }
                              disabled={isReadOnly}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "error.light",
                                  color: "#fff",
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "2px dashed",
                    borderColor: "grey.300",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    ยังไม่มีข้อมูลประสบการณ์ทำงาน
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    กรุณาเพิ่มข้อมูลประสบการณ์ทำงานด้านบน
                  </Typography>
                </Box>
              )}
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* CV Upload */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ไฟล์ CV
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  disabled={isReadOnly}
                >
                  อัปโหลดไฟล์
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={onFileChange}
                  />
                </Button>
                {(selectedFile || formData.cvFile) && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {formData.cvFile && !selectedFile ? (
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleDownload(formData.cvFile || "")}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          "&:hover": {
                            color: "primary.main",
                          },
                        }}
                      >
                        <Download fontSize="small" />
                        {getFileName(formData.cvFile)}
                      </Link>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        {selectedFile?.name ||
                          getFileName(formData.cvFile || "")}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </TabPanel>

        {/* Tab 3: Address */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 700, mb: 3, color: "primary.main" }}
              >
                ที่อยู่ตามบัตรประชาชน
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="เลขที่/หมู่บ้าน/อาคาร"
                  value={formData.idCardAddress?.houseNo || ""}
                  onChange={(e) =>
                    onFormDataChange("idCardAddress.houseNo", e.target.value)
                  }
                  slotProps={{ input: { readOnly: true } }}
                />

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="หมู่"
                    size="small"
                    value={formData.idCardAddress?.moo || "-"}
                    onChange={(e) =>
                      onFormDataChange("idCardAddress.moo", e.target.value)
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="ซอย"
                    size="small"
                    value={formData.idCardAddress?.soi || "-"}
                    onChange={(e) =>
                      onFormDataChange("idCardAddress.soi", e.target.value)
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="ถนน"
                    size="small"
                    value={formData.idCardAddress?.road || "-"}
                    onChange={(e) =>
                      onFormDataChange("idCardAddress.road", e.target.value)
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {/* <Autocomplete
                    options={provinceList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      provinceList?.find(
                        (p) => p.id === formData.idCardAddress?.province
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      callDistrict(newValue?.id || 0);
                      onFormDataChange(
                        "idCardAddress.province",
                        newValue?.id || null
                      );
                      onFormDataChange("idCardAddress.district", 0);
                      onFormDataChange("idCardAddress.subDistrict", 0);
                      onFormDataChange("idCardAddress.postalCode", "");
                    }}
                    isOptionEqualToValue={(option: Province, value: Province) =>
                      option.id === value.id
                    }
                    disabled={isReadOnly}
                    size="small"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        size="small"
                        label="จังหวัด"
                        fullWidth
                        required
                      />
                    )}
                  /> */}
                  <TextField
                    label="จังหวัด"
                    size="small"
                    value={formData.idCardAddress?.provinceName || "-"}
                    onChange={(e) =>
                      onFormDataChange(
                        "idCardAddress.provinceName",
                        e.target.value
                      )
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  {/* <Autocomplete
                    options={districtList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      districtList?.find(
                        (d) => d.id === formData.idCardAddress?.district
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      callSubDistrict(
                        formData.idCardAddress?.province || 0,
                        newValue?.id || 0
                      );
                      onFormDataChange(
                        "idCardAddress.district",
                        newValue?.id || null
                      );
                      onFormDataChange("idCardAddress.subDistrict", 0);
                      onFormDataChange(
                        "idCardAddress.postalCode",
                        newValue?.postCode || ""
                      );
                    }}
                    isOptionEqualToValue={(option: District, value: District) =>
                      option.id === value.id
                    }
                    disabled={isReadOnly || !formData.idCardAddress?.province}
                    size="small"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        size="small"
                        label="เขต/อำเภอ"
                        fullWidth
                        required
                      />
                    )}
                  /> */}
                  <TextField
                    label="เขต/อำเภอ"
                    size="small"
                    value={formData.idCardAddress?.districtName || "-"}
                    onChange={(e) =>
                      onFormDataChange(
                        "idCardAddress.districtName",
                        e.target.value
                      )
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                    gap: 2,
                  }}
                >
                  {/* <Autocomplete
                    options={subDistrictList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      subDistrictList?.find(
                        (s) => s.id === formData.idCardAddress?.subDistrict
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      onFormDataChange(
                        "idCardAddress.subDistrict",
                        newValue?.id || null
                      )
                    }
                    isOptionEqualToValue={(
                      option: SubDistrict,
                      value: SubDistrict
                    ) => option.id === value.id}
                    disabled={
                      isReadOnly ||
                      !formData.idCardAddress?.province ||
                      !formData.idCardAddress?.district
                    }
                    size="small"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        size="small"
                        label="แขวง/ตำบล"
                        fullWidth
                        required
                      />
                    )}
                  /> */}
                  <TextField
                    label="แขวง/ตำบล"
                    size="small"
                    value={formData.idCardAddress?.subDistrictName || "-"}
                    onChange={(e) =>
                      onFormDataChange(
                        "idCardAddress.subDistrictName",
                        e.target.value
                      )
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="รหัสไปรษณีย์"
                    size="small"
                    value={formData.idCardAddress?.postalCode || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 5) {
                        onFormDataChange("idCardAddress.postalCode", value);
                      }
                    }}
                    slotProps={{ input: { readOnly: true } }}
                    fullWidth
                    required
                    inputProps={{ maxLength: 5 }}
                    // helperText="กรอก 5 หลัก"
                  />
                </Box>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  ที่อยู่ที่ติดต่อได้
                </Typography>
                {/* <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        formData.contactAddress?.useIdCardAddress || false
                      }
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        const province = formData.idCardAddress?.province;
                        const district = formData.idCardAddress?.district;

                        onUseIdCardAddress(checked);

                        if (checked && province) {
                          await callDistrict2(province);
                          if (district) {
                            await callSubDistrict2(province, district);
                          }
                        }
                      }}
                      disabled={true}
                    />
                  }
                  label="ใช้ที่อยู่ตามบัตรประชาชน"
                /> */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        (formData.contactAddress?.houseNo || "")
                          .replace(/\s+/g, "") ===
                        (formData.idCardAddress?.houseNo || "")
                          .replace(/\s+/g, "")
                      }
                      disabled={true}
                    />
                  }
                  label="ใช้ที่อยู่ตามบัตรประชาชน"
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="เลขที่/หมู่บ้าน/อาคาร"
                  value={formData.contactAddress?.houseNo || ""}
                  onChange={(e) =>
                    onFormDataChange("contactAddress.houseNo", e.target.value)
                  }
                  // disabled={
                  //   isReadOnly || formData.contactAddress?.useIdCardAddress
                  // }
                  slotProps={{ input: { readOnly: true } }}
                />

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    label="หมู่"
                    size="small"
                    value={formData.contactAddress?.moo || "-"}
                    onChange={(e) =>
                      onFormDataChange("contactAddress.moo", e.target.value)
                    }
                    // disabled={
                    //   isReadOnly || formData.contactAddress?.useIdCardAddress
                    // }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="ซอย"
                    size="small"
                    value={formData.contactAddress?.soi || "-"}
                    onChange={(e) =>
                      onFormDataChange("contactAddress.soi", e.target.value)
                    }
                    // disabled={
                    //   isReadOnly || formData.contactAddress?.useIdCardAddress
                    // }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="ถนน"
                    size="small"
                    value={formData.contactAddress?.road || "-"}
                    onChange={(e) =>
                      onFormDataChange("contactAddress.road", e.target.value)
                    }
                    // disabled={
                    //   isReadOnly || formData.contactAddress?.useIdCardAddress
                    // }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {/* <Autocomplete
                    options={provinceList || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      provinceList?.find(
                        (p) => p.id === formData.contactAddress?.province
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      callDistrict2(newValue?.id || 0);
                      onFormDataChange(
                        "contactAddress.province",
                        newValue?.id || null
                      );
                      onFormDataChange("contactAddress.district", 0);
                      onFormDataChange("contactAddress.subDistrict", 0);
                      onFormDataChange("contactAddress.postalCode", "");
                    }}
                    isOptionEqualToValue={(option: Province, value: Province) =>
                      option.id === value.id
                    }
                    disabled={isReadOnly}
                    size="small"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        size="small"
                        label="จังหวัด"
                        fullWidth
                        required
                      />
                    )}
                  /> */}
                  <TextField
                    label="จังหวัด"
                    size="small"
                    value={formData.contactAddress?.provinceName || ""}
                    onChange={(e) =>
                      onFormDataChange(
                        "contactAddress.provinceName",
                        e.target.value
                      )
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  {/* <Autocomplete
                    options={districtList2 || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      districtList2?.find(
                        (d) => d.id === formData.contactAddress?.district
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      callSubDistrict2(
                        formData.contactAddress?.province || 0,
                        newValue?.id || 0
                      );
                      onFormDataChange(
                        "contactAddress.district",
                        newValue?.id || null
                      );
                      onFormDataChange("contactAddress.subDistrict", 0);
                      onFormDataChange(
                        "contactAddress.postalCode",
                        newValue?.postCode || ""
                      );
                    }}
                    isOptionEqualToValue={(option: District, value: District) =>
                      option.id === value.id
                    }
                    disabled={isReadOnly || !formData.contactAddress?.province}
                    size="small"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        size="small"
                        label="เขต/อำเภอ"
                        fullWidth
                        required
                      />
                    )}
                  /> */}
                  <TextField
                    label="เขต/อำเภอ"
                    size="small"
                    value={formData.contactAddress?.districtName || ""}
                    onChange={(e) =>
                      onFormDataChange(
                        "contactAddress.districtName",
                        e.target.value
                      )
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                    gap: 2,
                  }}
                >
                  {/* <Autocomplete
                    options={subDistrictList2 || []}
                    getOptionLabel={(option) => option.name}
                    value={
                      subDistrictList2?.find(
                        (s) => s.id === formData.contactAddress?.subDistrict
                      ) || null
                    }
                    onChange={(_, newValue) =>
                      onFormDataChange(
                        "contactAddress.subDistrict",
                        newValue?.id || null
                      )
                    }
                    isOptionEqualToValue={(
                      option: SubDistrict,
                      value: SubDistrict
                    ) => option.id === value.id}
                    disabled={
                      isReadOnly ||
                      !formData.contactAddress?.province ||
                      !formData.contactAddress?.district
                    }
                    size="small"
                    renderInput={(params: any) => (
                      <TextField
                        {...params}
                        size="small"
                        label="แขวง/ตำบล"
                        fullWidth
                        required
                      />
                    )}
                  /> */}
                  <TextField
                    label="แขวง/ตำบล"
                    size="small"
                    value={formData.contactAddress?.subDistrictName || ""}
                    onChange={(e) =>
                      onFormDataChange(
                        "contactAddress.subDistrictName",
                        e.target.value
                      )
                    }
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                  <TextField
                    label="รหัสไปรษณีย์"
                    size="small"
                    value={formData.contactAddress?.postalCode || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 5) {
                        onFormDataChange("contactAddress.postalCode", value);
                      }
                    }}
                    slotProps={{ input: { readOnly: true } }}
                    fullWidth
                    required
                    inputProps={{ maxLength: 5 }}
                    // helperText="กรอก 5 หลัก"
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        </TabPanel>

        {/* Tab 4: Bank Account */}
        {roleGroup === "admin" && (
          <TabPanel value={currentTab} index={3}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Form Section */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, color: "primary.main" }}
                >
                  เพิ่มบัญชีธนาคาร
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="เลขที่บัญชีธนาคาร"
                      value={bankAccountForm.bankAccountNumber}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setBankAccountForm({
                            ...bankAccountForm,
                            bankAccountNumber: value,
                          });
                        }
                      }}
                      disabled={mode === "view" || roleGroup !== "admin"}
                      helperText="กรอกเฉพาะตัวเลข"
                      size="small"
                    />
                    <Autocomplete
                      options={bankList || []}
                      getOptionLabel={(option) => option.name}
                      value={
                        bankList?.find((b) => b.id === bankAccountForm.bank) ||
                        null
                      }
                      onChange={(_, newValue) => {
                        setBankAccountForm({
                          ...bankAccountForm,
                          bank: newValue?.id || 0,
                        });
                      }}
                      isOptionEqualToValue={(
                        option: MasterData,
                        value: MasterData
                      ) => option.name === value.name}
                      disabled={mode === "view" || roleGroup !== "admin"}
                      size="small"
                      renderInput={(params: any) => (
                        <TextField
                          {...params}
                          label="ธนาคาร"
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="สาขาธนาคาร"
                      value={bankAccountForm.bankBranch}
                      onChange={(e) =>
                        setBankAccountForm({
                          ...bankAccountForm,
                          bankBranch: e.target.value,
                        })
                      }
                      disabled={mode === "view" || roleGroup !== "admin"}
                      size="small"
                    />

                    <Autocomplete
                      options={accountTypeList || []}
                      getOptionLabel={(option) => option.name}
                      value={
                        accountTypeList?.find(
                          (a) => a.id === bankAccountForm.accountType
                        ) || null
                      }
                      onChange={(_, newValue) =>
                        setBankAccountForm({
                          ...bankAccountForm,
                          accountType: newValue?.id || 0,
                        })
                      }
                      isOptionEqualToValue={(
                        option: MasterData,
                        value: MasterData
                      ) => option.name === value.name}
                      disabled={mode === "view" || roleGroup !== "admin"}
                      size="small"
                      title="ประเภทบัญชี"
                      renderInput={(params: any) => (
                        <TextField
                          {...params}
                          label="ประเภทบัญชี"
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Box>
                  <FormControl component="fieldset" sx={{ mt: 1 }}>
                    <FormLabel
                      component="legend"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      สถานะ
                    </FormLabel>
                    <RadioGroup
                      row
                      value={bankAccountForm.status}
                      onChange={(e) =>
                        setBankAccountForm({
                          ...bankAccountForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <FormControlLabel
                        value="active"
                        control={<Radio size="small" />}
                        label="ใช้งาน"
                        disabled={mode === "view" || roleGroup !== "admin"}
                      />
                      <FormControlLabel
                        value="inactive"
                        control={<Radio size="small" />}
                        label="ไม่ใช้งาน"
                        disabled={mode === "view" || roleGroup !== "admin"}
                      />
                    </RadioGroup>
                  </FormControl>

                  {/* File Upload Section */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      ไฟล์เอกสาร
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<Upload />}
                          disabled={mode === "view" || roleGroup !== "admin"}
                          fullWidth
                          size="small"
                          sx={{ mb: 1 }}
                        >
                          ไฟล์รูปหน้าบัญชีธนาคาร
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                            onChange={handleBankAccountPhotoChange}
                          />
                        </Button>
                        {(bankAccountPhotoFile ||
                          bankAccountForm.accountPhotoFile) && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {bankAccountPhotoFile?.name ||
                              (bankAccountForm.accountPhotoFile
                                ? getFileName(bankAccountForm.accountPhotoFile)
                                : "")}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<Upload />}
                          disabled={mode === "view" || roleGroup !== "admin"}
                          fullWidth
                          size="small"
                          sx={{ mb: 1 }}
                        >
                          ไฟล์ KTB
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                            onChange={handleKtbFileChange}
                          />
                        </Button>
                        {(ktbFile || bankAccountForm.ktbFile) && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {ktbFile?.name ||
                              (bankAccountForm.ktbFile
                                ? getFileName(bankAccountForm.ktbFile)
                                : "")}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddBankAccount}
                      disabled={mode === "view" || roleGroup !== "admin"}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 3,
                      }}
                    >
                      เพิ่มบัญชีธนาคาร
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Table Section */}
              {bankAccountList.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "#fff",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 3, color: "primary.main" }}
                  >
                    รายการบัญชีธนาคาร ({bankAccountList.length})
                  </Typography>
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "primary.main",
                            "& .MuiTableCell-head": {
                              color: "#fff",
                              fontWeight: 700,
                            },
                          }}
                        >
                          <TableCell>เลขที่บัญชี</TableCell>
                          <TableCell>ธนาคาร</TableCell>
                          <TableCell>สาขา</TableCell>
                          <TableCell>ประเภทบัญชี</TableCell>
                          <TableCell>สถานะ</TableCell>
                          <TableCell>ไฟล์รูปหน้าบัญชี</TableCell>
                          <TableCell>ไฟล์ KTB</TableCell>
                          <TableCell sx={{ width: 100 }} align="center">
                            การจัดการ
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bankAccountList.map((account) => (
                          <TableRow
                            key={account.id}
                            hover
                            sx={{
                              "&:nth-of-type(even)": {
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 500 }}>
                              {account.bankAccountNumber}
                            </TableCell>
                            <TableCell>
                              {bankList?.find((b) => b.id === account.bank)
                                ?.name || "-"}
                            </TableCell>
                            <TableCell>{account.bankBranch || "-"}</TableCell>
                            <TableCell>
                              {account.accountType === 1
                                ? "ออมทรัพย์"
                                : account.accountType === 2
                                ? "ประจำ"
                                : account.accountType === 3
                                ? "กระแสรายวัน"
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  account.status === "active"
                                    ? "ใช้งาน"
                                    : "ไม่ใช้งาน"
                                }
                                color={
                                  account.status === "active"
                                    ? "success"
                                    : "default"
                                }
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {account.accountPhotoFile ? (
                                <Link
                                  component="button"
                                  variant="body2"
                                  onClick={() =>
                                    handleDownload(
                                      account.accountPhotoFile || ""
                                    )
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    "&:hover": {
                                      color: "primary.main",
                                    },
                                  }}
                                >
                                  <Download fontSize="small" />
                                  {getFileName(account.accountPhotoFile)}
                                </Link>
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {account.ktbFile ? (
                                <Link
                                  component="button"
                                  variant="body2"
                                  onClick={() =>
                                    handleDownload(account.ktbFile || "")
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    "&:hover": {
                                      color: "primary.main",
                                    },
                                  }}
                                >
                                  <Download fontSize="small" />
                                  {getFileName(account.ktbFile)}
                                </Link>
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteBankAccount(account.id)
                                }
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "error.light",
                                    color: "#fff",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {bankAccountList.length === 0 && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "2px dashed",
                    borderColor: "grey.300",
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    ยังไม่มีข้อมูลบัญชีธนาคาร
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    กรุณาเพิ่มบัญชีธนาคารด้านบน
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>
        )}
      </Box>
    </Box>
  );
}
