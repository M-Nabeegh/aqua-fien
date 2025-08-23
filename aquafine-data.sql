--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: advances_legacy; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.advances_legacy OVERRIDING SYSTEM VALUE VALUES (1, NULL, 'customer', 'Gamma Corner Shop', '2025-08-06', 1200.00, 'Legacy import', '2025-08-16 22:36:54.373465+05');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (3, NULL, 'Alpha Traders', '1234567890123', '+923001112233', 'Market Road 1', '2025-07-17', 10, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (4, NULL, 'Beta Stores', '9876543210987', '+923004445555', 'Main Street 5', '2025-07-27', 5, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (10, NULL, 'Beta Stores', '3520265432101', '+923004445555', 'Mall Road, Lahore', '2025-06-18', 5, true, NULL, '2025-08-17 00:36:30.98096+05', '2025-08-17 00:36:30.98096+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (11, NULL, 'Gamma Suppliers', '3520298765432', '+923008887777', 'Shahrah-e-Faisal, Karachi', '2025-07-18', 7, true, NULL, '2025-08-17 00:36:30.98096+05', '2025-08-17 00:36:30.98096+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (12, NULL, 'Delta Enterprises', '3520245678903', '+923009999999', 'GT Road, Faisalabad', '2025-08-02', 12, true, NULL, '2025-08-17 00:36:30.98096+05', '2025-08-17 00:36:30.98096+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (13, 1, 'Nae', NULL, '+923001234567', 'Main Street, Lahore', '2025-08-17', 3, true, NULL, '2025-08-17 00:56:20.422686+05', '2025-08-17 00:56:20.422686+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (14, 1, 'Test Customer Fixed', NULL, '+923001234567', 'Test Address', '2025-08-17', 5, true, NULL, '2025-08-17 01:13:41.344806+05', '2025-08-17 01:13:41.344806+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (15, 1, 'sas', NULL, '+923133277891', 'asas', '2025-08-16', 1, true, NULL, '2025-08-17 01:15:25.789635+05', '2025-08-17 01:15:25.789635+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (16, 1, 'Muhammad Mahrus', NULL, '+923332904427', 'Flat No 5, first floor, Al Safia Plaza-Phase1, Street No 8, Diplai Memon Society Behind Rajputana Hospital, Hyderabad', '2025-08-05', 5, true, NULL, '2025-08-17 03:39:45.601923+05', '2025-08-17 03:39:45.601923+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (17, 1, 'Khalil Rehman', NULL, '+923332904427', 'Street#8,Al Safia Plaza, Deeplai Memon Society Behind Rajputana Hospital', '2025-08-13', 5, true, NULL, '2025-08-17 03:46:48.685706+05', '2025-08-17 03:46:48.685706+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (18, 1, 'ttte', NULL, '+923003068775', 'cccc', '2025-08-21', 1, true, NULL, '2025-08-22 20:19:00.518729+05', '2025-08-22 20:19:00.518729+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (19, 1, 'sawaiz', NULL, '+923003068775', '1111', '2025-08-20', 1, true, NULL, '2025-08-22 20:30:02.078428+05', '2025-08-22 20:30:02.078428+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (21, 1, 'rttt', NULL, '+923003068775', 'wwww', '2025-08-21', 11111, true, NULL, '2025-08-22 20:42:49.430229+05', '2025-08-22 20:42:49.430229+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (22, 1, 'qqqqq', NULL, '+923003068775', '1111', '2025-08-21', 1, true, NULL, '2025-08-22 20:44:32.049648+05', '2025-08-22 20:44:32.049648+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (9, NULL, 'Alpha Traders', NULL, '+923001111111', 'Main Street, Lahore', '2025-05-18', 10, true, NULL, '2025-08-17 00:36:30.98096+05', '2025-08-22 21:07:17.644113+05');
INSERT INTO public.customers OVERRIDING SYSTEM VALUE VALUES (20, 1, 'ssss', NULL, '+923003068775', '111', '2025-08-18', 1, true, NULL, '2025-08-22 20:31:01.885394+05', '2025-08-22 21:12:18.713041+05');


--
-- Data for Name: customer_advances; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customer_advances OVERRIDING SYSTEM VALUE VALUES (1, NULL, 3, '2025-08-09', 2000.00, 'Opening advance', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.customer_advances OVERRIDING SYSTEM VALUE VALUES (2, NULL, 4, '2025-08-11', 1500.00, 'Credit top-up', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.customer_advances OVERRIDING SYSTEM VALUE VALUES (4, 1, 3, '2025-08-17', 1500.00, 'Test customer advance direct', true, NULL, '2025-08-17 03:32:41.500358+05', '2025-08-17 03:32:41.500358+05');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.products OVERRIDING SYSTEM VALUE VALUES (7, 1, '1L', 'premium', 24.00, 22.00, 50.00, false, NULL, '2025-08-17 01:49:17.191408+05', '2025-08-17 01:49:58.408405+05');
INSERT INTO public.products OVERRIDING SYSTEM VALUE VALUES (6, NULL, 'Cap Pack', 'other', 30.00, NULL, NULL, false, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-17 01:55:20.095462+05');
INSERT INTO public.products OVERRIDING SYSTEM VALUE VALUES (5, NULL, 'Premium 19L', 'premium', 220.00, 200.00, 260.00, false, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-17 02:10:17.51088+05');
INSERT INTO public.products OVERRIDING SYSTEM VALUE VALUES (4, NULL, '19L Bottle Direct Test', 'standard', 198.00, 168.00, 238.00, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-17 02:52:13.669353+05');
INSERT INTO public.products OVERRIDING SYSTEM VALUE VALUES (8, 1, 'Test Product Direct', 'standard', 180.00, 150.00, 220.00, true, NULL, '2025-08-17 03:44:05.560319+05', '2025-08-17 03:44:05.560319+05');
INSERT INTO public.products OVERRIDING SYSTEM VALUE VALUES (9, 1, '1L bottleyyyy', 'standard', 200.00, 200.00, 398.99, true, NULL, '2025-08-17 03:46:22.57476+05', '2025-08-17 03:48:34.63218+05');


--
-- Data for Name: customer_pricing; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (2, NULL, 3, 4, 175.00, 'Volume discount', true, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:37:06.795916+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (10, 1, 21, 4, 200.00, NULL, true, '2025-08-22 20:42:49.457619+05', '2025-08-22 20:42:49.457619+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (11, 1, 21, 8, 206.00, NULL, true, '2025-08-22 20:42:49.496392+05', '2025-08-22 20:42:49.496392+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (12, 1, 21, 9, 212.00, NULL, true, '2025-08-22 20:42:49.497567+05', '2025-08-22 20:42:49.497567+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (13, 1, 22, 4, 199.00, NULL, true, '2025-08-22 20:44:32.068963+05', '2025-08-22 20:44:32.068963+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (14, 1, 22, 8, 186.00, NULL, true, '2025-08-22 20:44:32.080055+05', '2025-08-22 20:44:32.080055+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (15, 1, 22, 9, 210.00, NULL, true, '2025-08-22 20:44:32.081454+05', '2025-08-22 20:44:32.081454+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (5, 1, 20, 4, 201.00, NULL, true, '2025-08-22 20:35:46.843648+05', '2025-08-22 21:12:18.737752+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (6, 1, 20, 8, 219.00, NULL, true, '2025-08-22 20:35:46.843648+05', '2025-08-22 21:12:18.741496+05');
INSERT INTO public.customer_pricing OVERRIDING SYSTEM VALUE VALUES (7, 1, 20, 9, 398.00, NULL, true, '2025-08-22 20:35:46.843648+05', '2025-08-22 21:12:18.742754+05');


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (4, NULL, 'Ali Rider', '1111111111111', '+923331112222', 'rider', 45000.00, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (5, NULL, 'Sara Manager', '2222222222222', '+923334445555', 'manager', 80000.00, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (6, NULL, 'Omar Worker', '3333333333333', '+923337778888', 'worker', 35000.00, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (7, 1, 'Test Employee Minimal', NULL, NULL, 'manager', 50000.00, true, NULL, '2025-08-17 01:38:39.831583+05', '2025-08-17 01:38:39.831583+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (8, 1, 'Test Employee Full', '1234567890123', '+923001234567', 'manager', 50000.00, true, NULL, '2025-08-17 01:38:48.184095+05', '2025-08-17 01:38:48.184095+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (9, 1, 'seeexxx', '1111111111111', '+923003068775', 'manager', 123333.00, true, NULL, '2025-08-17 01:40:57.865874+05', '2025-08-17 01:40:57.865874+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (10, 1, 'Test Rider Direct', NULL, '+923001234567', 'rider', 40000.00, true, NULL, '2025-08-17 02:05:44.101769+05', '2025-08-17 02:05:44.101769+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (11, 1, 'swd', '3543254545546', '+926566566775', 'rider', 600.00, true, NULL, '2025-08-17 02:09:50.235667+05', '2025-08-17 02:09:50.235667+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (12, 1, 'Quiz Type', '4546546757656', '+9235346456546', 'worker', 6546.00, true, NULL, '2025-08-17 02:22:09.900723+05', '2025-08-17 02:22:09.900723+05');
INSERT INTO public.employees OVERRIDING SYSTEM VALUE VALUES (13, 1, 'sawiz ', '4444433211111', '+9230030271901', 'manager', 300.00, true, NULL, '2025-08-22 20:10:26.558607+05', '2025-08-22 20:10:26.558607+05');


--
-- Data for Name: employee_advances; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employee_advances OVERRIDING SYSTEM VALUE VALUES (1, NULL, 4, '2025-08-10', 5000.00, 'Fuel float', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.employee_advances OVERRIDING SYSTEM VALUE VALUES (2, NULL, 6, '2025-08-12', 3000.00, 'Tools', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.employee_advances OVERRIDING SYSTEM VALUE VALUES (3, 1, 4, '2025-08-17', 5000.00, 'Test employee advance direct', true, NULL, '2025-08-17 03:05:19.865646+05', '2025-08-17 03:05:19.865646+05');
INSERT INTO public.employee_advances OVERRIDING SYSTEM VALUE VALUES (4, 1, 4, '2025-08-17', 2500.00, 'Comprehensive test', true, NULL, '2025-08-17 03:10:37.099376+05', '2025-08-17 03:10:37.099376+05');
INSERT INTO public.employee_advances OVERRIDING SYSTEM VALUE VALUES (5, 1, 4, '2025-08-17', 2500.00, 'Comprehensive test', true, NULL, '2025-08-17 03:10:43.062015+05', '2025-08-17 03:10:43.062015+05');


--
-- Data for Name: expenditures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (1, NULL, '2025-08-10', 'transportation', 3200.00, 'Fuel', 4, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (2, NULL, '2025-08-11', 'utilities', 1500.00, 'Electricity bill', NULL, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (3, NULL, '2025-08-13', 'maintenance', 2000.00, 'Vehicle service', 6, true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (4, NULL, '2025-08-14', 'transportation', 800.00, 'yakki', 11, true, NULL, '2025-08-17 03:28:47.985129+05', '2025-08-17 03:28:47.985129+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (5, NULL, '2025-08-16', 'administrative', 1000000.00, 'sawaiz ki gaand', 9, true, NULL, '2025-08-17 03:50:33.358178+05', '2025-08-17 03:50:33.358178+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (6, NULL, '2025-08-21', 'utilities', 32000.00, 'theee ', 13, true, NULL, '2025-08-22 21:22:58.597034+05', '2025-08-22 21:22:58.597034+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (7, NULL, '2025-08-14', 'administrative', 2000.00, 'theeeee ', 13, true, NULL, '2025-08-22 21:29:15.194418+05', '2025-08-22 21:29:15.194418+05');
INSERT INTO public.expenditures OVERRIDING SYSTEM VALUE VALUES (8, NULL, '2025-08-14', 'transportation', 11222.00, 'aaa', NULL, true, NULL, '2025-08-22 21:42:00.543404+05', '2025-08-22 21:42:00.543404+05');


--
-- Data for Name: pricing_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (2, NULL, 3, 4, NULL, 170.00, 'Volume discount', NULL, 'INSERT', 'trigger', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (3, NULL, 3, 4, 170.00, 175.00, 'Volume discount', NULL, 'UPDATE', 'trigger', '2025-08-16 22:37:06.795916+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (4, 1, 20, 4, NULL, 212.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:35:46.843648+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (5, 1, 20, 8, NULL, 160.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:35:46.843648+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (6, 1, 20, 9, NULL, 210.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:35:46.843648+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (7, 1, 21, 4, NULL, 200.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:42:49.457619+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (8, 1, 21, 8, NULL, 206.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:42:49.496392+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (9, 1, 21, 9, NULL, 212.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:42:49.497567+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (10, 1, 22, 4, NULL, 199.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:44:32.068963+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (11, 1, 22, 8, NULL, 186.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:44:32.080055+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (12, 1, 22, 9, NULL, 210.00, NULL, NULL, 'INSERT', 'trigger', '2025-08-22 20:44:32.081454+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (13, 1, 20, 4, 212.00, 212.00, NULL, NULL, 'UPDATE', 'trigger', '2025-08-22 21:12:18.72721+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (14, 1, 20, 8, 160.00, 160.00, NULL, NULL, 'UPDATE', 'trigger', '2025-08-22 21:12:18.72721+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (15, 1, 20, 9, 210.00, 210.00, NULL, NULL, 'UPDATE', 'trigger', '2025-08-22 21:12:18.72721+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (16, 1, 20, 4, 212.00, 201.00, NULL, NULL, 'UPDATE', 'trigger', '2025-08-22 21:12:18.737752+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (17, 1, 20, 8, 160.00, 219.00, NULL, NULL, 'UPDATE', 'trigger', '2025-08-22 21:12:18.741496+05');
INSERT INTO public.pricing_history OVERRIDING SYSTEM VALUE VALUES (18, 1, 20, 9, 210.00, 398.00, NULL, NULL, 'UPDATE', 'trigger', '2025-08-22 21:12:18.742754+05');


--
-- Data for Name: rider_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.rider_activities OVERRIDING SYSTEM VALUE VALUES (1, NULL, '2025-08-10', 4, 12, 10, 9, 'Good day', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.rider_activities OVERRIDING SYSTEM VALUE VALUES (2, NULL, '2025-08-11', 4, 10, 8, 7, 'OK', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.rider_activities OVERRIDING SYSTEM VALUE VALUES (3, NULL, '2025-08-12', 4, 14, 12, 11, 'Busy', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');


--
-- Data for Name: sell_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sell_orders OVERRIDING SYSTEM VALUE VALUES (1, NULL, '2025-08-10', 3, 4, 10, 170.00, 1700.00, 5, 'Route A', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.sell_orders OVERRIDING SYSTEM VALUE VALUES (2, NULL, '2025-08-11', 4, 4, 8, 180.00, 1440.00, 5, 'Route B', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');
INSERT INTO public.sell_orders OVERRIDING SYSTEM VALUE VALUES (3, NULL, '2025-08-13', 3, 5, 5, 220.00, 1100.00, 5, 'Route A', true, NULL, '2025-08-16 22:36:54.373465+05', '2025-08-16 22:36:54.373465+05');


--
-- Name: advances_legacy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.advances_legacy_id_seq', 1, true);


--
-- Name: customer_advances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_advances_id_seq', 4, true);


--
-- Name: customer_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_pricing_id_seq', 18, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 22, true);


--
-- Name: employee_advances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_advances_id_seq', 5, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 13, true);


--
-- Name: expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenditures_id_seq', 8, true);


--
-- Name: pricing_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pricing_history_id_seq', 18, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 9, true);


--
-- Name: rider_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rider_activities_id_seq', 3, true);


--
-- Name: sell_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sell_orders_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

