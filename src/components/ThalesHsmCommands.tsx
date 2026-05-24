import { useMemo, useState } from 'react';

interface HsmCommand {
  command: string;
  response: string;
  function: string;
  supported: boolean;
  note: string;
}

const HSM_COMMANDS: HsmCommand[] = [
  { command: 'A0', response: 'A1', function: 'Generate a Key', supported: true, note: '' },
  { command: 'A2', response: 'A3, AZ', function: 'Generate and Print a Component', supported: false, note: 'Printer handling' },
  { command: 'A4', response: 'A5', function: 'Form a Key from Encrypted Components', supported: true, note: '' },
  { command: 'A6', response: 'A7', function: 'Import a Key', supported: true, note: '' },
  { command: 'A8', response: 'A9', function: 'Export a Key', supported: true, note: '' },
  { command: 'AA', response: 'AB', function: 'Translate a TMK, TPK or PVK', supported: false, note: '' },
  { command: 'AC', response: 'AD', function: 'Translate a TAK', supported: false, note: '' },
  { command: 'AE', response: 'AF', function: 'Translate a TMK, TPK or PVK from LMK to Another TMK, TPK or PVK', supported: true, note: '' },
  { command: 'AG', response: 'AH', function: 'Translate a TAK from LMK to TMK Encryption', supported: true, note: '' },
  { command: 'AQ', response: 'AR', function: 'Translate an RSA-encrypted PIN to a ZPK or TPK-encrypted', supported: true, note: '' },
  { command: 'AS', response: 'AT', function: 'Generate a CVK Pair', supported: false, note: '' },
  { command: 'AU', response: 'AV', function: 'Translate a CVK Pair from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'AW', response: 'AX', function: 'Translate a CVK Pair from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'AY', response: 'AZ', function: 'Translate a CVK Pair from Old LMK to New LMK Encryption', supported: false, note: '' },
  { command: 'B0', response: 'B1', function: 'Translate Key Scheme', supported: true, note: '' },
  { command: 'B2', response: 'B3', function: 'Echo Command', supported: true, note: '' },
  { command: 'B8', response: 'B9', function: 'TR-34 Key Export', supported: true, note: '' },
  { command: 'BA', response: 'BB', function: 'Encrypt a Clear PIN', supported: true, note: '' },
  { command: 'BC', response: 'BD', function: 'Verify a Terminal PIN Using the Comparison Method', supported: true, note: '' },
  { command: 'BE', response: 'BF', function: 'Verify an Interchange PIN Using the Comparison Method', supported: true, note: '' },
  { command: 'BG', response: 'BH', function: 'Translate a PIN and PIN Length', supported: false, note: 'Missing KEY CHANGE STORAGE' },
  { command: 'BI', response: 'BJ', function: 'Generate a BDK', supported: true, note: '' },
  { command: 'BK', response: 'BL', function: 'Generate an IBM PIN Offset (of a customer selected PIN)', supported: true, note: '' },
  { command: 'BM', response: 'BN', function: 'Load the Excluded PIN Table', supported: false, note: '' },
  { command: 'BQ', response: 'BR', function: 'Translate PIN Algorithm', supported: false, note: '' },
  { command: 'BS', response: 'BT', function: 'Erase the Key Change Storage', supported: false, note: '' },
  { command: 'BU', response: 'BV', function: 'Generate a Key Check Value', supported: true, note: '' },
  { command: 'BW', response: 'BX', function: 'Translate Keys from Old LMK to New LMK', supported: true, note: '' },
  { command: 'BY', response: 'BZ', function: 'Translate ZMK from ZMK to LMK encryption', supported: true, note: '' },
  { command: 'C0', response: 'C1', function: 'Generate Initial Terminal Master Keys (AS2805)', supported: true, note: 'Term' },
  { command: 'C2', response: 'C3', function: 'Generate a MAC (Message Authentication Code, large messages) (AS2805)', supported: true, note: '' },
  { command: 'C4', response: 'C5', function: 'Verify MAC (Message Authentication Code, large messages) (AS2805)', supported: true, note: '' },
  { command: 'C6', response: 'C7', function: 'Generate a Random Number (AS2805)', supported: true, note: 'Term' },
  { command: 'C8', response: 'C9', function: 'Generate an Acquirer Master Key Encrypting Key (AS2805)', supported: true, note: '' },
  { command: 'CA', response: 'CB', function: 'Translate a PIN from TPK to ZPK Encryption', supported: true, note: '' },
  { command: 'CC', response: 'CD', function: 'Translate a PIN from One ZPK to Another', supported: true, note: '' },
  { command: 'CE', response: 'CF', function: 'Generate a Diebold PIN Offset', supported: false, note: '' },
  { command: 'CG', response: 'CH', function: 'Verify a Terminal PIN Using the Diebold Method', supported: true, note: 'Custom Code' },
  { command: 'CI', response: 'CJ', function: 'Translate a PIN from BDK to ZPK Encryption (DUKPT)', supported: true, note: '' },
  { command: 'CK', response: 'CL', function: 'Verify a PIN Using the IBM Method (DUKPT)', supported: true, note: '' },
  { command: 'CM', response: 'CN', function: 'Verify a PIN Using the VISA PVV Method (DUKPT)', supported: true, note: '' },
  { command: 'CO', response: 'CP', function: 'Verify a PIN Using the Diebold Method (DUKPT)', supported: false, note: '' },
  { command: 'CQ', response: 'CR', function: 'Verify a PIN Using the Encrypted PIN Method (DUKPT)', supported: false, note: '' },
  { command: 'CS', response: 'CT', function: 'Modify Key Block Header', supported: true, note: '' },
  { command: 'CU', response: 'CV', function: 'Verify & Generate a VISA PVV (of a customer selected PIN)', supported: true, note: '' },
  { command: 'CW', response: 'CX', function: 'Generate a Card Verification Code/Value', supported: true, note: '' },
  { command: 'CY', response: 'CZ', function: 'Verify a Card Verification Code/Value', supported: true, note: '' },
  { command: 'D0', response: 'D1', function: 'Generate a PIN Pad Authentication Code (AS2805)', supported: true, note: 'Term' },
  { command: 'D2', response: 'D3', function: 'Verify a PIN pad Authentication code (AS2805)', supported: true, note: 'Term' },
  { command: 'D4', response: 'D5', function: 'Translate a PIN Block to Encryption under a PIN Encryption Key (AS2805)', supported: false, note: 'Term' },
  { command: 'D6', response: 'D7', function: 'Translate an Acquirer Master Key Encrypting Key (AS2805)', supported: false, note: 'Term' },
  { command: 'D8', response: 'D9', function: 'Encrypt a CPAT Authentication Value (AS2805)', supported: false, note: 'Term' },
  { command: 'DA', response: 'DB', function: 'Verify a Terminal PIN Using the IBM Method', supported: true, note: '' },
  { command: 'DC', response: 'DD', function: 'Verify a Terminal PIN Using the VISA Method', supported: true, note: '' },
  { command: 'DE', response: 'DF', function: 'Generate an IBM PIN Offset (of an LMK encrypted PIN)', supported: true, note: '' },
  { command: 'DG', response: 'DH', function: 'Generate a VISA PIN Verification Value (of an LMK encrypted PIN)', supported: true, note: '' },
  { command: 'DI', response: 'DJ', function: 'Generate and Export a KML', supported: false, note: '' },
  { command: 'DK', response: 'DL', function: 'Import a KML', supported: false, note: '' },
  { command: 'DM', response: 'DN', function: 'Verify Load Signature S1 and Generate Load Signature S2', supported: false, note: '' },
  { command: 'DO', response: 'DP', function: 'Verify Load Completion Signature S3', supported: false, note: '' },
  { command: 'DQ', response: 'DR', function: 'Verify Unload Signature S1 and Generate Unload Signature S2', supported: false, note: '' },
  { command: 'DS', response: 'DT', function: 'Verify Unload Completion Signature S3', supported: false, note: '' },
  { command: 'DU', response: 'DV', function: 'Verify & Generate an IBM PIN Offset (of customer selected new PIN)', supported: true, note: '' },
  { command: 'DW', response: 'DX', function: 'Translate a BDK from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'DY', response: 'DZ', function: 'Translate a BDK from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'E0', response: 'E1', function: 'Generate a KEKs Validation Request (AS2805)', supported: true, note: '' },
  { command: 'E2', response: 'E3', function: 'Generate a KEKr Validation Response (AS2805)', supported: true, note: '' },
  { command: 'E4', response: 'E5', function: 'Verify a PIN Pad Proof of End Point (POEP) (AS2805)', supported: true, note: 'Term' },
  { command: 'E6', response: 'E7', function: 'Generate a PIN Pad Proof of Endpoint (AS2805)', supported: false, note: 'Term' },
  { command: 'E8', response: 'E9', function: 'Generate a KCA and KMACH (AS2805)', supported: false, note: 'Term' },
  { command: 'EA', response: 'EB', function: 'Verify an Interchange PIN Using the IBM Method', supported: true, note: '' },
  { command: 'EC', response: 'ED', function: 'Verify an Interchange PIN Using the VISA Method', supported: true, note: '' },
  { command: 'EE', response: 'EF', function: 'Derive a PIN Using the IBM Method', supported: true, note: '' },
  { command: 'EG', response: 'EH', function: 'Verify an Interchange PIN Using the Diebold Method', supported: true, note: 'Custom Code' },
  { command: 'EI', response: 'EJ', function: 'Generate an RSA Key Set', supported: true, note: '' },
  { command: 'EK', response: 'EL', function: 'Load an RSA Secret Key', supported: true, note: '' },
  { command: 'EM', response: 'EN', function: 'Translate an RSA Secret Key', supported: false, note: '' },
  { command: 'EO', response: 'EP', function: 'Import a Public Key (Generate a MAC on an RSA Public Key)', supported: true, note: '' },
  { command: 'EQ', response: 'ER', function: 'Validate a Public Key (Verify a MAC on an RSA Public Key)', supported: true, note: '' },
  { command: 'ES', response: 'ET', function: 'Validate a Certificate and Generate a MAC on its RSA Public Key', supported: true, note: '' },
  { command: 'EU', response: 'EV', function: 'Translate a MAC on an RSA Public Key', supported: false, note: '' },
  { command: 'EW', response: 'EX', function: 'Generate an RSA Signature', supported: true, note: '' },
  { command: 'EY', response: 'EZ', function: 'Validate an RSA Signature', supported: true, note: '' },
  { command: 'F0', response: 'F1', function: 'Verify a Terminal PIN using the IBM Method (AS2805)', supported: true, note: 'Term' },
  { command: 'F2', response: 'F3', function: 'Verify a Terminal PIN using the VISA Method (AS2805)', supported: true, note: 'Term' },
  { command: 'F4', response: 'F5', function: 'Calculate KMACI', supported: true, note: '' },
  { command: 'F6', response: 'F7', function: 'KEKGEN (AS2805)', supported: false, note: '' },
  { command: 'F8', response: 'F9', function: 'KEKREC (AS2805)', supported: false, note: '' },
  { command: 'FA', response: 'FB', function: 'Translate a ZPK from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'FC', response: 'FD', function: 'Translate a TMK, TPK or PVK from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'FE', response: 'FF', function: 'Translate a TMK, TPK or PVK from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'FG', response: 'FH', function: 'Generate a Pair of PVKs', supported: true, note: '' },
  { command: 'FI', response: 'FJ', function: 'Generate ZEK/ZAK', supported: true, note: '' },
  { command: 'FK', response: 'FL', function: 'Translate a ZEK/ZAK from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'FM', response: 'FN', function: 'Translate a ZEK/ZAK from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'FO', response: 'FP', function: 'Generate a Watchword Key', supported: false, note: '' },
  { command: 'FQ', response: 'FR', function: 'Translate a Watchword Key from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'FS', response: 'FT', function: 'Translate a Watchword Key from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'FU', response: 'FV', function: 'Verify a Watchword Response', supported: false, note: '' },
  { command: 'FW', response: 'FX', function: 'Generate a VISA PIN Verification Value (of a customer selected PIN)', supported: true, note: '' },
  { command: 'G0', response: 'G1', function: 'Translate a PIN from BDK to ZPK Encryption (3DES DUKPT)', supported: true, note: '' },
  { command: 'GA', response: 'GB', function: 'Derive a PIN Using the Diebold Method', supported: false, note: '' },
  { command: 'GC', response: 'GD', function: 'Translate a ZPK from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'GE', response: 'GF', function: 'Translate a ZMK', supported: false, note: '' },
  { command: 'GG', response: 'GH', function: 'Form a ZMK from Three ZMK Components', supported: false, note: '' },
  { command: 'GI', response: 'GJ', function: 'Import Key under an RSA Public Key', supported: true, note: '' },
  { command: 'GK', response: 'GL', function: 'Export Key under an RSA Public Key', supported: true, note: '' },
  { command: 'GM', response: 'GN', function: 'Hash a Block of Data', supported: true, note: '' },
  { command: 'GO', response: 'GP', function: 'Verify a PIN Using the IBM Method (3DES DUKPT)', supported: true, note: '' },
  { command: 'GQ', response: 'GR', function: 'Verify a PIN Using the VISA PVV Method (3DES DUKPT)', supported: true, note: '' },
  { command: 'GS', response: 'GT', function: 'Verify a PIN Using the Diebold Method (3DES DUKPT)', supported: false, note: '' },
  { command: 'GU', response: 'GV', function: 'Verify a PIN Using the Encrypted PIN Method (3DES DUKPT)', supported: true, note: 'Custom Code' },
  { command: 'GW', response: 'GX', function: 'Generate/Verify a MAC (3DES DUKPT)', supported: true, note: '' },
  { command: 'GY', response: 'GZ', function: 'Form a ZMK from 2 to 9 ZMK Components', supported: true, note: '' },
  { command: 'H0', response: 'H1', function: 'Decrypt a PIN Pad Public Key (AS2805)', supported: true, note: '' },
  { command: 'H2', response: 'H3', function: 'Generate a RSA Public Key Verification Code (AS2805)', supported: true, note: '' },
  { command: 'H4', response: 'H5', function: 'Generate a KEKs for use in Node to Node interchange using RSA (AS2805)', supported: true, note: '' },
  { command: 'H6', response: 'H7', function: 'Receive a KEKr for use in Node to Node interchange using RSA (AS2805)', supported: true, note: '' },
  { command: 'H8', response: 'H9', function: 'Encrypt a Cross Acquirer Key Encrypting Key under an Initial Transport Key (AS2805)', supported: true, note: '' },
  { command: 'HA', response: 'HB', function: 'Generate a TAK', supported: true, note: '' },
  { command: 'HC', response: 'HD', function: 'Generate a TMK, TPK or PVK', supported: true, note: '' },
  { command: 'HK', response: 'HL', function: 'Generate Transaction Response, With AP', supported: true, note: '' },
  { command: 'I0', response: 'I1', function: 'Encrypt a Terminal Key under the Local Master Key (AS2805)', supported: false, note: 'Term' },
  { command: 'I2', response: 'I3', function: 'Import MULTOS Transport Key Certifying Key', supported: false, note: 'EMV Issuing' },
  { command: 'I4', response: 'I5', function: 'Import MULTOS Hash Modulus Key', supported: false, note: 'EMV Issuing' },
  { command: 'I6', response: 'I7', function: 'Translate MULTOS KTU', supported: false, note: 'EMV Issuing' },
  { command: 'I8', response: 'I9', function: 'MULTOS ALU Generator', supported: false, note: 'EMV Issuing' },
  { command: 'IA', response: 'IB', function: 'Generate a ZPK', supported: true, note: '' },
  { command: 'IC', response: 'ID', function: 'Establish Secure Session with Chip Card', supported: false, note: 'EMV Issuing' },
  { command: 'IE', response: 'IF', function: 'Prepare Secure Message for Chip Card', supported: false, note: 'EMV Issuing' },
  { command: 'JA', response: 'JB', function: 'Generate a Random PIN', supported: true, note: '' },
  { command: 'JC', response: 'JD', function: 'Translate a PIN from TPK to LMK Encryption', supported: true, note: '' },
  { command: 'JE', response: 'JF', function: 'Translate a PIN from ZPK to LMK Encryption', supported: true, note: '' },
  { command: 'JG', response: 'JH', function: 'Translate a PIN from LMK to ZPK Encryption', supported: true, note: '' },
  { command: 'K0', response: 'K1', function: 'Verify Encrypted Counters (EMV)', supported: false, note: '' },
  { command: 'K2', response: 'K3', function: 'Verify Truncated Application Cryptogram (MasterCard CAP)', supported: false, note: '' },
  { command: 'K8', response: 'K9', function: 'Export a Key under a KEK', supported: false, note: '' },
  { command: 'KA', response: 'KB', function: 'Generate a Key Check Value (Not Double-Length ZMK)', supported: true, note: '' },
  { command: 'KC', response: 'KD', function: 'Translate a ZPK', supported: false, note: '' },
  { command: 'KE', response: 'KF', function: 'Generate Issuer RSA Key Set and Public Key Certificate', supported: false, note: 'EMV Issuing' },
  { command: 'KG', response: 'KH', function: 'Validate an Issuer Public Key Certificate', supported: false, note: 'EMV Issuing' },
  { command: 'KI', response: 'KJ', function: 'Derive Card Unique DES Keys', supported: false, note: 'EMV Issuing' },
  { command: 'KK', response: 'KL', function: 'Import a Certification Authority Self-Signed Certificate', supported: false, note: 'EMV Issuing' },
  { command: 'KM', response: 'KN', function: 'Generate Static Data Authentication Signature', supported: false, note: 'EMV Issuing' },
  { command: 'KO', response: 'KP', function: 'Generate Card RSA Key Set and Public Key Certificate', supported: false, note: 'EMV Issuing' },
  { command: 'KQ', response: 'KR', function: 'ARQC Verification and/or ARPC Generation (EMV 3.1.1)', supported: true, note: '' },
  { command: 'KS', response: 'KT', function: 'Data Authentication Code and Dynamic Number Verification (EMV 3.1.1)', supported: true, note: '' },
  { command: 'KU', response: 'KV', function: 'Generate Secure Message (EMV 3.1.1)', supported: false, note: '' },
  { command: 'KW', response: 'KX', function: 'ARQC Verification and/or ARPC Generation (EMV 4.x)', supported: true, note: '' },
  { command: 'KY', response: 'KZ', function: 'Generate Secure Message (EMV 4.x)', supported: false, note: '' },
  { command: 'L0', response: 'L1', function: 'Generate an HMAC Secret Key', supported: true, note: '' },
  { command: 'LA', response: 'LB', function: 'Load Data to User Storage', supported: false, note: '' },
  { command: 'LC', response: 'LD', function: 'Verify the Diebold Table in User Storage', supported: false, note: '' },
  { command: 'LE', response: 'LF', function: 'Read Data from User Storage', supported: false, note: '' },
  { command: 'LG', response: 'LH', function: 'Set HSM Response Delay', supported: false, note: 'Custom Code, no real functionality yet' },
  { command: 'LI', response: 'LJ', function: 'Load a PIN Text String', supported: false, note: '' },
  { command: 'LK', response: 'LL', function: 'Generate a Decimal MAC', supported: false, note: '' },
  { command: 'LM', response: 'LN', function: 'Verify a Decimal MAC', supported: false, note: '' },
  { command: 'LO', response: 'LP', function: 'Translate Decimalisation Table from Old to New LMK', supported: false, note: '' },
  { command: 'LQ', response: 'LR', function: 'Generate an HMAC on a Block of Data', supported: true, note: '' },
  { command: 'LS', response: 'LT', function: 'Verify an HMAC on a Block of Data', supported: true, note: '' },
  { command: 'LU', response: 'LV', function: 'Import an HMAC key under a ZMK', supported: false, note: '' },
  { command: 'LW', response: 'LX', function: 'Export an HMAC key under a ZMK', supported: true, note: '' },
  { command: 'LY', response: 'LZ', function: 'Translate a HMAC Key from Old LMK to New LMK', supported: false, note: '' },
  { command: 'M0', response: 'M1', function: 'Encrypt Data Block', supported: true, note: '' },
  { command: 'M2', response: 'M3', function: 'Decrypt Data Block', supported: true, note: '' },
  { command: 'M4', response: 'M5', function: 'Translate Data Block', supported: true, note: '' },
  { command: 'M6', response: 'M7', function: 'Generate MAC', supported: true, note: '' },
  { command: 'M8', response: 'M9', function: 'Verify MAC', supported: true, note: '' },
  { command: 'MA', response: 'MB', function: 'Generate a MAC', supported: false, note: '' },
  { command: 'MC', response: 'MD', function: 'Verify a MAC', supported: false, note: '' },
  { command: 'ME', response: 'MF', function: 'Verify and Translate a MAC', supported: false, note: '' },
  { command: 'MG', response: 'MH', function: 'Translate a TAK from LMK to ZMK Encryption', supported: true, note: '' },
  { command: 'MI', response: 'MJ', function: 'Translate a TAK from ZMK to LMK Encryption', supported: true, note: '' },
  { command: 'MK', response: 'ML', function: 'Generate a Binary MAC', supported: false, note: '' },
  { command: 'MM', response: 'MN', function: 'Verify a Binary MAC', supported: false, note: '' },
  { command: 'MO', response: 'MP', function: 'Verify and Translate a Binary MAC', supported: false, note: '' },
  { command: 'MQ', response: 'MR', function: 'Generate MAC (MAB) for Large Message', supported: false, note: '' },
  { command: 'MS', response: 'MT', function: 'Generate MAC (MAB) using ANSI X9.19 Method for a Large Message', supported: true, note: '' },
  { command: 'MY', response: 'MZ', function: 'Verify and Translate MAC', supported: false, note: '' },
  { command: 'N0', response: 'N1', function: 'Generate a Random Value', supported: true, note: '' },
  { command: 'NC', response: 'ND', function: 'Perform Diagnostics', supported: false, note: '' },
  { command: 'NE', response: 'NF, NZ', function: 'Generate and Print a Key as Split Components', supported: false, note: '' },
  { command: 'NG', response: 'NH', function: 'Decrypt an Encrypted PIN', supported: false, note: '' },
  { command: 'NI', response: 'NJ', function: 'Return Network Information', supported: false, note: '' },
  { command: 'NK', response: 'NL', function: 'Command Chaining', supported: false, note: '' },
  { command: 'NO', response: 'NP', function: 'HSM Status', supported: false, note: '' },
  { command: 'NY', response: 'NZ', function: 'Generate IVCVC3 and Static CVC3', supported: false, note: 'EMV Issuing' },
  { command: 'OA', response: 'OB, OZ', function: 'Print a PIN Solicitation Mailer', supported: false, note: '' },
  { command: 'OC', response: 'OD, OZ', function: 'Generate and Print a ZMK Component', supported: false, note: '' },
  { command: 'OE', response: 'OF, OZ', function: 'Generate and Print a TMK, TPK or PVK', supported: false, note: '' },
  { command: 'OI', response: 'OJ', function: 'Generate a Set of Zone Keys (AS2805)', supported: true, note: '' },
  { command: 'OK', response: 'OL', function: 'Translate a Set of Zone Keys to Encryption under the Local Master Key (AS2805)', supported: true, note: '' },
  { command: 'OU', response: 'OV', function: 'Update Terminal Master Key 1 (Roll KEK 1) (AS2805)', supported: true, note: 'Term' },
  { command: 'OW', response: 'OX', function: 'Update Terminal Master Keys (Roll KEK 1 and KEK 2) (AS2805)', supported: true, note: 'Term' },
  { command: 'P2', response: 'P3', function: 'Generate a VISA PVV (AS2805)', supported: false, note: 'Term' },
  { command: 'P4', response: 'P5', function: 'Generate a Proof of Host value (AS2805)', supported: false, note: 'Term' },
  { command: 'PA', response: 'PB', function: 'Load Formatting Data to HSM', supported: true, note: '' },
  { command: 'PC', response: 'PD', function: 'Load Additional Formatting Data to HSM', supported: false, note: '' },
  { command: 'PE', response: 'PF, PZ', function: 'Print PIN/PIN and Solicitation Data', supported: false, note: '' },
  { command: 'PG', response: 'PH', function: 'Verify PIN/PIN and Solicitation Mailer Cryptography', supported: false, note: '' },
  { command: 'PI', response: 'PJ', function: 'Generate Terminal Key Set (AS2805)', supported: true, note: 'Term' },
  { command: 'PK', response: 'PL', function: 'Generate a PIN Pad Acquirer Security Number (AS2805)', supported: false, note: 'Term' },
  { command: 'PM', response: 'PN', function: 'Verify a Dynamic CVV (dCVV)', supported: true, note: '' },
  { command: 'PO', response: 'PP', function: 'Verify and Generate a VISA PVV, translate a PIN Block to Encryption under a Zone PIN Key (AS2805)', supported: true, note: 'Term' },
  { command: 'PQ', response: 'PR', function: 'Generate a Message Authentication Code AS2805-1988 (AS2805)', supported: false, note: '' },
  { command: 'PS', response: 'PT', function: 'Validate a Message Authentication Code AS2805-1988 (AS2805)', supported: false, note: '' },
  { command: 'PU', response: 'PV', function: 'Encrypt data (AS2805)', supported: true, note: '' },
  { command: 'PW', response: 'PX', function: 'Decrypt data (AS2805)', supported: true, note: '' },
  { command: 'PY', response: 'PZ', function: 'Verify and Generate an IBM PIN Offset (AS2805)', supported: false, note: 'Term' },
  { command: 'Q0', response: 'Q1', function: 'Translate Audit Record MAC key', supported: false, note: '' },
  { command: 'Q2', response: 'Q3', function: 'Retrieve Audit Record', supported: false, note: '' },
  { command: 'Q4', response: 'Q5', function: 'Archive (Print) Audit Record', supported: false, note: '' },
  { command: 'Q6', response: 'Q7', function: 'Delete Audit Record', supported: false, note: '' },
  { command: 'Q8', response: 'Q9', function: 'Audit Record Verification', supported: false, note: '' },
  { command: 'QA', response: 'QB', function: 'Load Solicitation Data to User Storage', supported: false, note: '' },
  { command: 'QC', response: 'QD', function: 'Final Load of Solicitation Data to User Storage', supported: false, note: '' },
  { command: 'QE', response: 'QF', function: 'Generate a Certificate Request', supported: true, note: '' },
  { command: 'QI', response: 'QJ', function: 'Translate a PPASN from old to new LMK (AS2805)', supported: false, note: 'Term' },
  { command: 'QM', response: 'QN', function: 'Data Encryption Using a Derived Privacy Key (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'QO', response: 'QP', function: 'Data Decryption Using a Derived Privacy Key (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'QQ', response: 'QR', function: 'Verify a PIN at Card Issuer using IBM Method (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'QS', response: 'QT', function: 'Verify a PIN at Card Issuer using the Diebold Method (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'QU', response: 'QV', function: 'Verify a PIN at Card Issuer using Visa Method (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'QW', response: 'QX', function: 'Verify a PIN at Card Issuer using the Comparison Method (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RA', response: 'RB', function: 'Cancel Authorised Activities', supported: false, note: '' },
  { command: 'RC', response: 'RD', function: 'Verify Solicitation Mailer Cryptography', supported: false, note: '' },
  { command: 'RE', response: 'RF', function: 'Verify a Transaction Request, without PIN (AS2805.6.2)', supported: true, note: 'Term' },
  { command: 'RG', response: 'RH', function: 'Verify a Transaction Request, with PIN, when CD Field Available (AS2805.6.2)', supported: true, note: 'Term' },
  { command: 'RI', response: 'RJ', function: 'Verify a Transaction Request, with PIN, when CD Field not Available (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RI', response: 'RJ', function: 'Transaction Request With a PIN (T/AQ Key)', supported: false, note: '' },
  { command: 'RK', response: 'RL', function: 'Generate Transaction Response, with Auth Para Generated by Acquirer (AS2805.6.2)', supported: true, note: 'Term' },
  { command: 'RK', response: 'RL', function: 'Transaction Request Without a PIN', supported: false, note: '' },
  { command: 'RM', response: 'RN', function: 'Generate Transaction Response with Auth Para Generated by Card Issuer (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RM', response: 'RN', function: 'Administration Request Message', supported: false, note: '' },
  { command: 'RO', response: 'RP', function: 'Translate a PIN from PEK to ZPK Encryption (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RO', response: 'RP', function: 'Transaction Response with Auth Para from Card Issuer', supported: false, note: '' },
  { command: 'RQ', response: 'RR', function: 'Verify a Transaction Completion Confirmation Request (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RQ', response: 'RR', function: 'Generate Auth Para and Transaction Response', supported: false, note: '' },
  { command: 'RS', response: 'RT', function: 'Generate a Transaction Completion Response (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RS', response: 'RT', function: 'Confirmation', supported: false, note: '' },
  { command: 'RU', response: 'RV', function: 'Generate Auth Para at the Card Issuer (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RU', response: 'RV', function: 'Transaction Request With a PIN (T/CI Key)', supported: false, note: '' },
  { command: 'RW', response: 'RX', function: 'Generate an Initial Terminal Key (AS2805.6.2)', supported: false, note: 'Term' },
  { command: 'RW', response: 'RX', function: 'Translate KEYVAL', supported: false, note: '' },
  { command: 'RY', response: 'RZ', function: 'Calculate Card Security Codes', supported: false, note: '' },
  { command: 'RY', response: 'RZ', function: 'Verify Card Security Codes', supported: false, note: '' },
  { command: 'RY', response: 'RZ', function: 'Generate a CSCK', supported: false, note: '' },
  { command: 'RY', response: 'RZ', function: 'Export a CSCK', supported: false, note: '' },
  { command: 'RY', response: 'RZ', function: 'Import a CSCK', supported: false, note: '' },
];

const COMMAND_CATEGORIES = [
  { id: 'all', label: 'All Commands', color: 'slate' },
  { id: 'supported', label: 'BP-HSM Supported', color: 'green' },
  { id: 'pin', label: 'PIN Operations', color: 'purple' },
  { id: 'key', label: 'Key Management', color: 'blue' },
  { id: 'mac', label: 'MAC & Encryption', color: 'amber' },
  { id: 'emv', label: 'EMV/RSA', color: 'indigo' },
  { id: 'as2805', label: 'AS2805', color: 'teal' },
];

export function ThalesHsmCommands({ className = '' }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCommands = useMemo(() => {
    return HSM_COMMANDS.filter(cmd => {
      const matchesSearch = !searchQuery.trim() ||
        cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.function.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.note.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || (() => {
        const funcLower = cmd.function.toLowerCase();
        switch (selectedCategory) {
          case 'supported': return cmd.supported;
          case 'pin': return funcLower.includes('pin');
          case 'key': return funcLower.includes('key') || funcLower.includes('tmk') || funcLower.includes('tpk') || funcLower.includes('zmk') || funcLower.includes('bdk');
          case 'mac': return funcLower.includes('mac') || funcLower.includes('encrypt') || funcLower.includes('decrypt') || funcLower.includes('hmac');
          case 'emv': return funcLower.includes('emv') || funcLower.includes('rsa') || funcLower.includes('cvv') || funcLower.includes('cvc');
          case 'as2805': return funcLower.includes('as2805') || cmd.note.includes('AS2805');
          default: return true;
        }
      })();

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getCommandCode = (cmd: HsmCommand) => {
    return `${cmd.command} (${cmd.response})`;
  };

  const getCommandColor = (cmd: HsmCommand) => {
    if (!cmd.supported) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  return (
    <div className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Thales HSM Commands Reference
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Complete list of Thales Hardware Security Module commands with descriptions
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by command code, function, or notes..."
          className="w-full px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Category Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {COMMAND_CATEGORIES.map(cat => {
          const count = cat.id === 'all' ? HSM_COMMANDS.length :
            cat.id === 'supported' ? HSM_COMMANDS.filter(c => c.supported).length :
            cat.id === 'pin' ? HSM_COMMANDS.filter(c => c.function.toLowerCase().includes('pin')).length :
            cat.id === 'key' ? HSM_COMMANDS.filter(c => c.function.toLowerCase().includes('key') || c.function.toLowerCase().includes('tmk') || c.function.toLowerCase().includes('tpk') || c.function.toLowerCase().includes('zmk') || c.function.toLowerCase().includes('bdk')).length :
            cat.id === 'mac' ? HSM_COMMANDS.filter(c => c.function.toLowerCase().includes('mac') || c.function.toLowerCase().includes('encrypt') || c.function.toLowerCase().includes('decrypt') || c.function.toLowerCase().includes('hmac')).length :
            cat.id === 'emv' ? HSM_COMMANDS.filter(c => c.function.toLowerCase().includes('emv') || c.function.toLowerCase().includes('rsa') || c.function.toLowerCase().includes('cvv') || c.function.toLowerCase().includes('cvc')).length :
            HSM_COMMANDS.filter(c => c.function.toLowerCase().includes('as2805') || c.note.includes('AS2805')).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredCommands.length} of {HSM_COMMANDS.length} commands
      </div>

      {/* Commands Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[120px]">Command</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[100px]">BP-HSM</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Function</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[150px]">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommands.map((cmd, idx) => (
              <tr
                key={`${cmd.command}-${idx}`}
                className="border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                    {cmd.command}
                  </span>
                  {cmd.response && (
                    <span className="text-slate-500 dark:text-zinc-500 ml-2">
                      ({cmd.response})
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {cmd.supported ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      ✓ Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500">
                      ✗ No
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                  {cmd.function}
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-zinc-500 text-xs">
                  {cmd.note || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCommands.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-zinc-500">
          <p>No HSM commands found matching your search.</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Command Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <p><span className="font-mono font-bold">A0</span> - Host Request Command</p>
            <p><span className="font-mono font-bold">A1</span> - Host Response Command (last char +1)</p>
          </div>
          <div>
            <p><span className="font-bold">BP-HSM</span> - Supported by BP-HSM implementation</p>
            <p><span className="font-bold">Notes</span> - Additional info (AS2805, EMV, Term, etc.)</p>
          </div>
        </div>
      </div>

      {/* Source */}
      <div className="mt-4 text-xs text-slate-400 dark:text-zinc-600 text-center">
        Source: <a href="https://www.eftlab.com/knowledge-base/complete-list-of-thales-hsm-commands" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">EFT Lab</a>
      </div>
    </div>
  );
}

export default ThalesHsmCommands;
