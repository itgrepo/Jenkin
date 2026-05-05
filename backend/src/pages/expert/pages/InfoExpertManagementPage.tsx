import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@hooks/useRedux";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
} from "@mui/material";

import ExpertForm from "../components/ExpertForm";
import ConsentDialog from "../components/ConsentDialog";
import { upsertExpert, getExpertByUserId } from "@services/expertService";
// Types are now included in ExpertFormData
import {
  showSuccess,
  showError,
  showConfirm,
  showWarning,
} from "@components/Swal";
import { fetchAppProvince, setGlobalLoading } from "@store/globalSlice";
import { useValidateFile } from "@hooks/validateFile";
import { uploadFileServer } from "@utils/fileService";
import { Expert, EducationData, TrainingData, WorkExperienceData, BankAccountData } from "@models/expert";

const initialFormData: Expert = {
  idCard: "",
  prefix: 0,
  firstName: "",
  lastName: "",
  phone: "",
  mobile: "",
  email: "",
  educations: [],
  trainings: [],
  workExperiences: [],
  cvFile: "",
  idCardAddress: {
    houseNo: "",
    moo: "",
    soi: "",
    road: "",
    subDistrict: 0,
    district: 0,
    province: 0,
    postalCode: "",
  },
  contactAddress: {
    useIdCardAddress: false,
    houseNo: "",
    moo: "",
    soi: "",
    road: "",
    subDistrict: 0,
    district: 0,
    province: 0,
    postalCode: "",
  },
  bankAccount: [],
  userId: 0,
};

export default function InfoExpertManagementPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const roleId = useAppSelector((state) => state.auth.user?.role?.id);
  const [formData, setFormData] = useState<Expert>({
    idCard: user?.contact_tax_id || "",
    prefix: Number(user?.contact_prefix_name) || 0,
    firstName: user?.contact_first_name || "",
    lastName: user?.contact_last_name || "",
    phone: user?.contact_tel || "",
    mobile: user?.contact_phone_number || "",
    email: user?.email || "",
    educations: [],
    trainings: [],
    workExperiences: [],
    cvFile: "",
    idCardAddress: {
      houseNo: user?.address_no||"",
      moo: user?.moo||"",
      soi: user?.soi||"",
      road: user?.street||"",
      subDistrict: 0,
      subDistrictName:user?.subdistrict||"",
      district: 0,
      districtName:user?.district||"",
      province: 0,
      provinceName:user?.province||"",
      postalCode: user?.zipcode||"",
    },
    contactAddress: {
      useIdCardAddress: true,
      houseNo: user?.contact_address_no||"",
      moo: user?.contact_moo||"",
      soi: user?.contact_soi||"",
      road: user?.contact_street||"",
      subDistrict: 0,
      subDistrictName:user?.contact_subdistrict||"",
      district: 0,
      districtName:user?.contact_district||"",
      province: 0,
      provinceName:user?.contact_province||"",
      postalCode: user?.contact_zipcode||"",
    },
    bankAccount: [],
    userId: user?.id || 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openConsentDialog, setOpenConsentDialog] = useState(false);
  const [isLoadingExpert, setIsLoadingExpert] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasExpertData, setHasExpertData] = useState(false);

  const { validate } = useValidateFile();


  const {
    provinceList,
  } = useAppSelector((state) => state?.global);

  useEffect(() => {
    if (!provinceList) {
      dispatch(fetchAppProvince());
    }
  }, [
    dispatch,
    provinceList
  ]);

  // Memoize callback functions to prevent infinite loops
  const handleEducationListChange = useCallback((list: EducationData[]) => {
    setFormData((prev) => ({ ...prev, educations: list }));
  }, []);

  const handleTrainingListChange = useCallback((list: TrainingData[]) => {
    setFormData((prev) => ({ ...prev, trainings: list }));
  }, []);

  const handleWorkExperienceListChange = useCallback((list: WorkExperienceData[]) => {
    setFormData((prev) => ({ ...prev, workExperiences: list }));
  }, []);

  const handleBankAccountListChange = useCallback((list: BankAccountData[]) => {
    setFormData((prev) => ({ ...prev, bankAccount: list }));
  }, []);


  // ดึงข้อมูล expert เมื่อ component mount
  useEffect(() => {
    const fetchExpertData = async () => {
      if (roleId === 6 && user?.id && provinceList && provinceList?.length > 0) {
        try {
          setIsLoadingExpert(true);
          dispatch(setGlobalLoading(true));
          const expertData = await getExpertByUserId(user.id);

          // const provinceId = provinceList?.find(p => p.name === user?.province)?.id||0;
          // const contactProvinceId = provinceList?.find(p => p.name === user?.contact_province)?.id||0;

          // const district= await getDistrict(provinceId);
          // const contactDistrict= await getDistrict(contactProvinceId);
          // const districtId = district?.find(s => s.name.toLowerCase().includes(user?.subdistrict?.toLowerCase()||""))?.id||0;
          // const contactDistrictId = contactDistrict?.find(s => s.name.toLowerCase().includes(user?.contact_subdistrict?.toLowerCase()||""))?.id||0;

          // const subDistrict= await getSubDistrict(provinceId,districtId);
          // const contactSubDistrict= await getSubDistrict(contactProvinceId,contactDistrictId);
          // const subDistrictId = subDistrict?.find(s => s.name.toLowerCase().includes(user?.subdistrict?.toLowerCase()||""))?.id||0;
          // const contactSubDistrictId = contactSubDistrict?.find(s => s.name.toLowerCase().includes(user?.contact_subdistrict?.toLowerCase()||""))?.id||0;

          // console.log("subDistrict:",subDistrict)
          // console.log("user?.subdistrict:",user?.subdistrict)
          // console.log("contactSubDistrict:",contactSubDistrict)
          // console.log("user?.contact_subdistrict:",user?.contact_subdistrict)


          if (expertData?.id && expertData?.id > 0) {
            // Ensure idCardAddress and contactAddress exist
            const dataWithDefaults = {
              ...expertData,
              idCardAddress:  {
                houseNo: expertData.idCardAddress?.houseNo||user?.address_no||"",
                moo: expertData.idCardAddress?.moo||user?.moo||"",
                soi: expertData.idCardAddress?.soi||user?.soi||"",
                road: expertData.idCardAddress?.road||user?.street||"",
                subDistrict: expertData.idCardAddress?.subDistrict||0,
                subDistrictName: expertData.idCardAddress?.subDistrictName||"",
                district: expertData.idCardAddress?.district||0,
                districtName: expertData.idCardAddress?.districtName||"",
                province: expertData.idCardAddress?.province||0,
                provinceName: expertData.idCardAddress?.provinceName||"",
                postalCode: expertData.idCardAddress?.postalCode||user?.zipcode||"",
              },
              contactAddress:  {
                useIdCardAddress: true,
                houseNo: expertData.contactAddress?.houseNo||user?.contact_address_no||"",
                moo: expertData.contactAddress?.moo||user?.contact_moo||"",
                soi: expertData.contactAddress?.soi||user?.contact_soi||"",
                road: expertData.contactAddress?.road||user?.contact_street||"",
                subDistrict: expertData.contactAddress?.subDistrict||0,
                subDistrictName: expertData.contactAddress?.subDistrictName||"",
                district: expertData.contactAddress?.district||0,
                districtName: expertData.contactAddress?.districtName||"",
                province: expertData.contactAddress?.province||0,
                provinceName: expertData.contactAddress?.provinceName||"",
                postalCode: expertData.contactAddress?.postalCode||user?.contact_zipcode||"",
              },
            };
            setFormData(dataWithDefaults);
            setHasExpertData(true);
          } else {
            setOpenConsentDialog(true);
          }
        } catch (error: any) {
          console.error("Error fetching expert:", error);
          // ถ้าเกิด error ให้แสดง consent dialog
          setOpenConsentDialog(true);
        } finally {
          setIsLoadingExpert(false);
          dispatch(setGlobalLoading(false));
        }
      }
    };

    fetchExpertData();
  }, [roleId, user?.id, dispatch,provinceList]);

  const handleConsentConfirm = () => {
    setOpenConsentDialog(false);
    setHasConsent(true);
    // หลังจากยืนยัน consent แล้ว ให้แสดง form สำหรับกรอกข้อมูล
  };

  const handleConsentClose = () => {
    // ถ้าไม่ยอมรับ ให้ redirect กลับไปหน้าหลัก
    navigate("/");
  };

  const handleFormDataChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Expert] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleUseIdCardAddress = (checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        contactAddress: {
          ...prev.idCardAddress,
          useIdCardAddress: true,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        contactAddress: {
          ...prev.contactAddress,
          useIdCardAddress: false,
        },
      }));
    }
  };

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     setSelectedFile(file);
  //     handleFormDataChange("cvFile", file.name);
  //   }
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected) {
      setSelectedFile(null);
      return;
    }

    const errorMessage = validate(selected);
    if (errorMessage) {
      showWarning("แจ้งเตือน", errorMessage);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(selected);
    //  handleFormDataChange("cvFile", selected.name);
  };

  const handleSave = async () => {
    // แสดง confirm dialog ก่อนบันทึก

    const isEdit = !!formData.id;

    const confirmResult = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการบันทึก",
      isEdit
        ? "คุณต้องการอัปเดตข้อมูลผู้เชี่ยวชาญใช่หรือไม่?"
        : "คุณต้องการบันทึกข้อมูลผู้เชี่ยวชาญใช่หรือไม่?",
      "บันทึก",
      "ยกเลิก"
    );

    // ถ้าไม่ยืนยัน ให้ยกเลิกการบันทึก
    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      dispatch(setGlobalLoading(true));

      // สร้าง copy ของ formData เพื่อไม่ให้ mutate state โดยตรง
      const dataToSave = { ...formData };

      // ตรวจสอบและ set default value สำหรับ cvFile
      if (!dataToSave.cvFile) {
        dataToSave.cvFile = "";
      }
      // อัปโหลดไฟล์ถ้ามี
      if (selectedFile) {
        try {
          const filename = await uploadFileServer({
            file: selectedFile,
            folder: "expert/cv",
            oldFile: formData?.cvFile || "",
          });

          if (!filename) {
            showError(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
            );
            dispatch(setGlobalLoading(false));
            return;
          }

          dataToSave.cvFile = filename;
        } catch (uploadError: any) {
          console.error("Upload error:", uploadError);
          console.error("Upload error response:", uploadError?.response?.data);
          const uploadErrorMessage =
            uploadError?.response?.data?.error ||
            uploadError?.response?.data?.message ||
            uploadError?.message ||
            "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง";
          showError("เกิดข้อผิดพลาด", uploadErrorMessage);
          dispatch(setGlobalLoading(false));
          return;
        }
      }

      // Upsert expert - create if not exists, update if exists
      const response = await upsertExpert(dataToSave);

      // เก็บ expertId ไว้สำหรับการอัปเดตครั้งต่อไป
      if (response && response?.id) {
        setFormData(response);
      }

      // แสดงข้อความสำเร็จ
      if (isEdit) {
        showSuccess("สำเร็จ", "อัปเดตข้อมูลผู้เชี่ยวชาญเรียบร้อยแล้ว");
      } else {
        showSuccess("สำเร็จ", "บันทึกข้อมูลผู้เชี่ยวชาญเรียบร้อยแล้ว");
      }

      setSelectedFile(null);
    } catch (error: any) {
      console.error("Error saving expert:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      showError("เกิดข้อผิดพลาด", errorMessage);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };


  return (
    <>
      <ConsentDialog
        open={openConsentDialog}
        onClose={handleConsentClose}
        onConfirm={handleConsentConfirm}
      />
      {!isLoadingExpert && (hasExpertData || hasConsent) && (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                color: "#fff",
                p: 3,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ข้อมูลผู้เชี่ยวชาญ
              </Typography>
            </Box>
            <ExpertForm
              formData={formData}
              mode={formData?.id?"edit":"add"}
              isReadOnly={false}
              onFormDataChange={handleFormDataChange}
              onUseIdCardAddress={handleUseIdCardAddress}
              onFileChange={handleFileChange}
              selectedFile={selectedFile}
              onEducationListChange={handleEducationListChange}
              onTrainingListChange={handleTrainingListChange}
              onWorkExperienceListChange={handleWorkExperienceListChange}
              onBankAccountListChange={handleBankAccountListChange}
              initialEducationList={formData.educations || []}
              initialTrainingList={formData.trainings || []}
              initialWorkExperienceList={formData.workExperiences || []}
              initialBankAccountList={formData.bankAccount || []}
            />
            <Box
              sx={{
                p: 3,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={async () => {
                  // โหลดข้อมูลเดิมกลับมา
                  if (user?.id) {
                    try {
                      dispatch(setGlobalLoading(true));
                      const expertData = await getExpertByUserId(user.id);
                      if (expertData?.id && expertData?.id > 0) {
                        setFormData(expertData);
                      } else {
                        setFormData({
                          ...initialFormData,
                          idCard: user?.contact_tax_id || "",
                          prefix: Number(user?.contact_prefix_name) || 0,
                          firstName: user?.contact_first_name || "",
                          lastName: user?.contact_last_name || "",
                          phone: user?.contact_tel || "",
                          mobile: user?.contact_phone_number || "",
                          email: user?.email || "",
                          userId: user.id || 0,
                          idCardAddress: expertData.idCardAddress || {
                            houseNo: user?.address_no||"",
                            moo: user?.moo||"",
                            soi: user?.soi||"",
                            road: user?.street||"",
                            subDistrict: 0,
                            district: 0,
                            province: 0,
                            postalCode: user?.zipcode||"",
                          },
                          contactAddress: expertData.contactAddress || {
                            useIdCardAddress: true,
                            houseNo: user?.contact_address_no||"",
                            moo: user?.contact_moo||"",
                            soi: user?.contact_soi||"",
                            road: user?.contact_street||"",
                            subDistrict: 0,
                            district: 0,
                            province: 0,
                            postalCode: user?.contact_zipcode||"",
                          },
                        });
                      }
                    } catch (error) {
                      console.error("Error loading expert data:", error);
                    } finally {
                      dispatch(setGlobalLoading(false));
                    }
                  }
                }}
              >
                ยกเลิก
              </Button>
              <Button variant="contained" onClick={handleSave}>
                บันทึก
              </Button>
            </Box>
          </Paper>
        </Container>
      )}
    </>
  );
}
