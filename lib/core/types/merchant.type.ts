export class AddressDto {
  id: number;
  state: string;
  city: string;
  IBGEStateCode: string | null;
  IBGECityCode: string | null;
  district: string;
  street: string;
  number: string;
  postalCode: string;
  complement: string | null;
  reference: string | null;
  latitude: number;
  longitude: number;
}

export class Merchant {
  id: number;
  address: AddressDto;
  name: string;
  document: string;
  corporateName: string;
  contactEmails: string[];
  commercialNumber: string;
}
