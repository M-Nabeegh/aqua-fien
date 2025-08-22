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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: customer_ledger_summary; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.customer_ledger_summary AS (
	total_advances numeric(12,2),
	total_sales numeric(12,2),
	remaining numeric(12,2),
	status text
);


ALTER TYPE public.customer_ledger_summary OWNER TO postgres;

--
-- Name: employee_ledger_summary; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employee_ledger_summary AS (
	salary numeric(12,2),
	total_advances numeric(12,2),
	remaining numeric(12,2),
	status text
);


ALTER TYPE public.employee_ledger_summary OWNER TO postgres;

--
-- Name: employee_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employee_type_enum AS ENUM (
    'worker',
    'manager',
    'rider'
);


ALTER TYPE public.employee_type_enum OWNER TO postgres;

--
-- Name: expenditure_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expenditure_category_enum AS ENUM (
    'transportation',
    'administrative',
    'maintenance',
    'utilities',
    'other'
);


ALTER TYPE public.expenditure_category_enum OWNER TO postgres;

--
-- Name: period_financials_row; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.period_financials_row AS (
	revenue numeric(12,2),
	expenses numeric(12,2),
	net_income numeric(12,2)
);


ALTER TYPE public.period_financials_row OWNER TO postgres;

--
-- Name: phone_dom; Type: DOMAIN; Schema: public; Owner: postgres
--

CREATE DOMAIN public.phone_dom AS text
	CONSTRAINT phone_dom_check CHECK ((VALUE ~ '^\+?[0-9]{10,15}$'::text));


ALTER DOMAIN public.phone_dom OWNER TO postgres;

--
-- Name: pk_money_dom; Type: DOMAIN; Schema: public; Owner: postgres
--

CREATE DOMAIN public.pk_money_dom AS numeric(12,2)
	CONSTRAINT pk_money_dom_check CHECK ((VALUE >= (0)::numeric));


ALTER DOMAIN public.pk_money_dom OWNER TO postgres;

--
-- Name: positive_int_dom; Type: DOMAIN; Schema: public; Owner: postgres
--

CREATE DOMAIN public.positive_int_dom AS integer
	CONSTRAINT positive_int_dom_check CHECK ((VALUE > 0));


ALTER DOMAIN public.positive_int_dom OWNER TO postgres;

--
-- Name: product_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_category_enum AS ENUM (
    'standard',
    'premium',
    'other'
);


ALTER TYPE public.product_category_enum OWNER TO postgres;

--
-- Name: rider_kpi_row; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rider_kpi_row AS (
	employee_id bigint,
	activity_date date,
	empty_bottles_received integer,
	filled_bottles_sent integer,
	filled_product_bought_back integer,
	accountability integer,
	efficiency_rate numeric(6,2)
);


ALTER TYPE public.rider_kpi_row OWNER TO postgres;

--
-- Name: assert_not_future_date(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.assert_not_future_date(d date) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF d > CURRENT_DATE THEN
    RAISE EXCEPTION 'Date % cannot be in the future (today: %)', d, CURRENT_DATE;
  END IF;
END$$;


ALTER FUNCTION public.assert_not_future_date(d date) OWNER TO postgres;

--
-- Name: current_actor_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_actor_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v json;
  s text;
  uid text;
BEGIN
  -- Try PostgREST/Supabase-style claims
  s := current_setting('request.jwt.claims', true);
  IF s IS NOT NULL THEN
    v := s::json;
    uid := COALESCE(v->>'user_id', v->>'sub', NULL);
    IF uid ~ '^[0-9]+$' THEN
      RETURN uid::bigint;
    END IF;
  END IF;

  -- Fallback to application setting
  s := current_setting('app.user_id', true);
  IF s IS NOT NULL AND s ~ '^[0-9]+$' THEN
    RETURN s::bigint;
  END IF;

  RETURN NULL;
END$_$;


ALTER FUNCTION public.current_actor_id() OWNER TO postgres;

--
-- Name: current_tenant_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_tenant_id() RETURNS bigint
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
  s text;
  v json;
  tid text;
BEGIN
  s := current_setting('request.jwt.claims', true);
  IF s IS NOT NULL THEN
    v := s::json;
    tid := v->>'tenant_id';
    IF tid ~ '^[0-9]+$' THEN RETURN tid::bigint; END IF;
  END IF;

  s := current_setting('app.tenant_id', true);
  IF s IS NOT NULL AND s ~ '^[0-9]+$' THEN
    RETURN s::bigint;
  END IF;

  RETURN NULL;
END$_$;


ALTER FUNCTION public.current_tenant_id() OWNER TO postgres;

--
-- Name: get_customer_ledger_summary(bigint, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_customer_ledger_summary(p_customer_id bigint, p_from date, p_to date) RETURNS public.customer_ledger_summary
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_adv numeric(12,2);
  v_sales numeric(12,2);
  v_rem numeric(12,2);
  v_status text;
BEGIN
  v_adv := COALESCE((
    SELECT SUM(amount) FROM customer_advances
    WHERE customer_id = p_customer_id
      AND is_active = true
      AND advance_date BETWEEN p_from AND p_to
  ), 0);

  v_sales := COALESCE((
    SELECT SUM(total_amount) FROM sell_orders
    WHERE customer_id = p_customer_id
      AND is_active = true
      AND bill_date BETWEEN p_from AND p_to
  ), 0);

  v_rem := v_adv - v_sales;
  v_status := CASE WHEN v_rem >= 0 THEN 'Credit' ELSE 'Debit' END;

  RETURN (v_adv, v_sales, v_rem, v_status);
END$$;


ALTER FUNCTION public.get_customer_ledger_summary(p_customer_id bigint, p_from date, p_to date) OWNER TO postgres;

--
-- Name: get_effective_price(bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_effective_price(p_customer_id bigint, p_product_id bigint) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_price numeric(12,2);
  v_base  numeric(12,2);
  v_active boolean;
BEGIN
  -- Custom price first (active record only)
  SELECT cp.custom_price
    INTO v_price
  FROM customer_pricing cp
  WHERE cp.customer_id = p_customer_id
    AND cp.product_id  = p_product_id
    AND cp.is_active = true
  LIMIT 1;

  IF v_price IS NOT NULL THEN
    RETURN v_price::numeric(10,2);
  END IF;

  -- Fallback to base price on active product
  SELECT base_price, is_active INTO v_base, v_active
  FROM products WHERE id = p_product_id;

  IF v_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Product % is inactive; no effective price available.', p_product_id;
  END IF;

  IF v_base IS NULL THEN
    RAISE EXCEPTION 'No base price for product %; cannot compute effective price.', p_product_id;
  END IF;

  RETURN v_base::numeric(10,2);
END$$;


ALTER FUNCTION public.get_effective_price(p_customer_id bigint, p_product_id bigint) OWNER TO postgres;

--
-- Name: get_employee_ledger_summary(bigint, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_employee_ledger_summary(p_employee_id bigint, p_from date, p_to date) RETURNS public.employee_ledger_summary
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_salary numeric(12,2);
  v_adv numeric(12,2);
  v_rem numeric(12,2);
  v_status text;
BEGIN
  SELECT monthly_salary INTO v_salary FROM employees WHERE id = p_employee_id;
  v_salary := COALESCE(v_salary, 0);

  v_adv := COALESCE((
    SELECT SUM(amount) FROM employee_advances
    WHERE employee_id = p_employee_id
      AND is_active = true
      AND advance_date BETWEEN p_from AND p_to
  ), 0);

  v_rem := v_salary - v_adv;
  v_status := CASE WHEN v_rem >= 0 THEN 'Positive' ELSE 'Deficit' END;

  RETURN (v_salary, v_adv, v_rem, v_status);
END$$;


ALTER FUNCTION public.get_employee_ledger_summary(p_employee_id bigint, p_from date, p_to date) OWNER TO postgres;

--
-- Name: period_financials(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.period_financials(p_from date, p_to date) RETURNS public.period_financials_row
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_rev numeric(12,2);
  v_exp numeric(12,2);
BEGIN
  v_rev := COALESCE( (SELECT SUM(total_amount) FROM sell_orders
                      WHERE is_active = true AND bill_date BETWEEN p_from AND p_to), 0);
  v_exp := COALESCE( (SELECT SUM(amount) FROM expenditures
                      WHERE is_active = true AND expense_date BETWEEN p_from AND p_to), 0);

  RETURN (v_rev, v_exp, v_rev - v_exp);
END$$;


ALTER FUNCTION public.period_financials(p_from date, p_to date) OWNER TO postgres;

--
-- Name: rider_kpis(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rider_kpis(p_from date, p_to date) RETURNS SETOF public.rider_kpi_row
    LANGUAGE sql
    AS $$
  SELECT
    ra.employee_id,
    ra.activity_date,
    SUM(ra.empty_bottles_received)        AS empty_bottles_received,
    SUM(ra.filled_bottles_sent)           AS filled_bottles_sent,
    SUM(ra.filled_product_bought_back)    AS filled_product_bought_back,
    SUM(ra.filled_bottles_sent) - SUM(ra.filled_product_bought_back) AS accountability,
    CASE
      WHEN SUM(ra.filled_bottles_sent) > 0
        THEN ROUND( ( (SUM(ra.filled_bottles_sent) - SUM(ra.filled_product_bought_back))::numeric
                      / SUM(ra.filled_bottles_sent)::numeric ) * 100, 2)
      ELSE 0
    END AS efficiency_rate
  FROM rider_activities ra
  WHERE ra.is_active = true
    AND ra.activity_date BETWEEN p_from AND p_to
  GROUP BY ra.employee_id, ra.activity_date
  ORDER BY ra.activity_date, ra.employee_id;
$$;


ALTER FUNCTION public.rider_kpis(p_from date, p_to date) OWNER TO postgres;

--
-- Name: trg_no_future_date(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_no_future_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  d date;
BEGIN
  d := (to_jsonb(NEW)->>TG_ARGV[0])::date;
  PERFORM assert_not_future_date(d);
  RETURN NEW;
END$$;


ALTER FUNCTION public.trg_no_future_date() OWNER TO postgres;

--
-- Name: trg_pricing_history_audit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_pricing_history_audit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pricing_history (tenant_id, customer_id, product_id, old_price, new_price, reason, changed_by, action)
    VALUES (NEW.tenant_id, NEW.customer_id, NEW.product_id, NULL, NEW.custom_price, NEW.reason, current_actor_id(), 'INSERT');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO pricing_history (tenant_id, customer_id, product_id, old_price, new_price, reason, changed_by, action)
    VALUES (NEW.tenant_id, NEW.customer_id, NEW.product_id, OLD.custom_price, NEW.custom_price, COALESCE(NEW.reason, OLD.reason), current_actor_id(), 'UPDATE');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO pricing_history (tenant_id, customer_id, product_id, old_price, new_price, reason, changed_by, action)
    VALUES (OLD.tenant_id, OLD.customer_id, OLD.product_id, OLD.custom_price, NULL, OLD.reason, current_actor_id(), 'DELETE');
    RETURN OLD;
  END IF;
  RETURN NULL;
END$$;


ALTER FUNCTION public.trg_pricing_history_audit() OWNER TO postgres;

--
-- Name: trg_sell_orders_validate(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_sell_orders_validate() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be > 0';
  END IF;

  IF NEW.bottle_cost IS NULL OR NEW.bottle_cost <= 0 THEN
    RAISE EXCEPTION 'bottle_cost must be > 0';
  END IF;

  -- auto-calc or validate total_amount
  IF NEW.total_amount IS NULL THEN
    NEW.total_amount := (NEW.quantity::numeric * NEW.bottle_cost)::numeric(12,2);
  ELSE
    IF NEW.total_amount != (NEW.quantity::numeric * NEW.bottle_cost)::numeric(12,2) THEN
      RAISE EXCEPTION 'total_amount % does not equal quantity*bottle_cost %',
        NEW.total_amount, (NEW.quantity::numeric * NEW.bottle_cost)::numeric(12,2);
    END IF;
  END IF;

  RETURN NEW;
END$$;


ALTER FUNCTION public.trg_sell_orders_validate() OWNER TO postgres;

--
-- Name: trg_validate_customer_pricing(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_validate_customer_pricing() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_min numeric(12,2);
  v_max numeric(12,2);
  v_active boolean;
BEGIN
  SELECT min_price, max_price, is_active
    INTO v_min, v_max, v_active
  FROM products
  WHERE id = NEW.product_id;

  IF v_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Cannot set pricing for inactive product (id=%).', NEW.product_id;
  END IF;

  IF v_min IS NOT NULL AND NEW.custom_price < v_min THEN
    RAISE EXCEPTION 'custom_price % is below product min % for product_id %', NEW.custom_price, v_min, NEW.product_id;
  END IF;

  IF v_max IS NOT NULL AND NEW.custom_price > v_max THEN
    RAISE EXCEPTION 'custom_price % exceeds product max % for product_id %', NEW.custom_price, v_max, NEW.product_id;
  END IF;

  RETURN NEW;
END$$;


ALTER FUNCTION public.trg_validate_customer_pricing() OWNER TO postgres;

--
-- Name: util_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.util_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;


ALTER FUNCTION public.util_set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advances_legacy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advances_legacy (
    id bigint NOT NULL,
    tenant_id bigint,
    person_kind text NOT NULL,
    person_name text NOT NULL,
    advance_date date NOT NULL,
    amount public.pk_money_dom NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT advances_legacy_amount_check CHECK (((amount)::numeric > (0)::numeric)),
    CONSTRAINT advances_legacy_person_kind_check CHECK ((person_kind = ANY (ARRAY['customer'::text, 'employee'::text])))
);


ALTER TABLE public.advances_legacy OWNER TO postgres;

--
-- Name: advances_legacy_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.advances_legacy ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.advances_legacy_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customer_advances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_advances (
    id bigint NOT NULL,
    tenant_id bigint,
    customer_id bigint NOT NULL,
    advance_date date NOT NULL,
    amount public.pk_money_dom NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_advances_amount_check CHECK (((amount)::numeric > (0)::numeric))
);


ALTER TABLE public.customer_advances OWNER TO postgres;

--
-- Name: customer_advances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customer_advances ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_advances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customer_pricing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_pricing (
    id bigint NOT NULL,
    tenant_id bigint,
    customer_id bigint NOT NULL,
    product_id bigint NOT NULL,
    custom_price public.pk_money_dom NOT NULL,
    reason text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_pricing_custom_price_check CHECK (((custom_price)::numeric > (0)::numeric))
);


ALTER TABLE public.customer_pricing OWNER TO postgres;

--
-- Name: customer_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customer_pricing ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_pricing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id bigint NOT NULL,
    tenant_id bigint,
    name text NOT NULL,
    cnic text,
    phone public.phone_dom,
    address text,
    joining_date date DEFAULT CURRENT_DATE NOT NULL,
    opening_bottles integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customers_opening_bottles_check CHECK ((opening_bottles >= 0))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: employee_advances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_advances (
    id bigint NOT NULL,
    tenant_id bigint,
    employee_id bigint NOT NULL,
    advance_date date NOT NULL,
    amount public.pk_money_dom NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_advances_amount_check CHECK (((amount)::numeric > (0)::numeric))
);


ALTER TABLE public.employee_advances OWNER TO postgres;

--
-- Name: employee_advances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employee_advances ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.employee_advances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    tenant_id bigint,
    name text NOT NULL,
    cnic text,
    phone public.phone_dom,
    employee_type public.employee_type_enum NOT NULL,
    monthly_salary public.pk_money_dom DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employees_cnic_check CHECK ((cnic ~ '^[0-9]{13}$'::text))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employees ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: expenditures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenditures (
    id bigint NOT NULL,
    tenant_id bigint,
    expense_date date NOT NULL,
    category public.expenditure_category_enum NOT NULL,
    amount public.pk_money_dom NOT NULL,
    description text,
    employee_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT expenditures_amount_check CHECK (((amount)::numeric > (0)::numeric))
);


ALTER TABLE public.expenditures OWNER TO postgres;

--
-- Name: expenditures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.expenditures ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.expenditures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sell_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sell_orders (
    id bigint NOT NULL,
    tenant_id bigint,
    bill_date date NOT NULL,
    customer_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity public.positive_int_dom NOT NULL,
    bottle_cost public.pk_money_dom NOT NULL,
    total_amount public.pk_money_dom,
    salesman_employee_id bigint,
    remarks text,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sell_orders_bottle_cost_check CHECK (((bottle_cost)::numeric > (0)::numeric))
);


ALTER TABLE public.sell_orders OWNER TO postgres;

--
-- Name: mv_monthly_financials; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.mv_monthly_financials AS
 WITH months AS (
         SELECT (date_trunc('month'::text, s.d))::date AS month_start
           FROM generate_series((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '1 year'::interval), date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone), '1 mon'::interval) s(d)
        )
 SELECT m.month_start AS month,
    (COALESCE(( SELECT sum((so.total_amount)::numeric) AS sum
           FROM public.sell_orders so
          WHERE ((so.is_active = true) AND (so.bill_date >= m.month_start) AND (so.bill_date < (m.month_start + '1 mon'::interval)))), (0)::numeric))::numeric(12,2) AS revenue,
    (COALESCE(( SELECT sum((ex.amount)::numeric) AS sum
           FROM public.expenditures ex
          WHERE ((ex.is_active = true) AND (ex.expense_date >= m.month_start) AND (ex.expense_date < (m.month_start + '1 mon'::interval)))), (0)::numeric))::numeric(12,2) AS expenses,
    ((COALESCE(( SELECT sum((so.total_amount)::numeric) AS sum
           FROM public.sell_orders so
          WHERE ((so.is_active = true) AND (so.bill_date >= m.month_start) AND (so.bill_date < (m.month_start + '1 mon'::interval)))), (0)::numeric) - COALESCE(( SELECT sum((ex.amount)::numeric) AS sum
           FROM public.expenditures ex
          WHERE ((ex.is_active = true) AND (ex.expense_date >= m.month_start) AND (ex.expense_date < (m.month_start + '1 mon'::interval)))), (0)::numeric)))::numeric(12,2) AS net_income
   FROM months m
  WITH NO DATA;


ALTER TABLE public.mv_monthly_financials OWNER TO postgres;

--
-- Name: pricing_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_history (
    id bigint NOT NULL,
    tenant_id bigint,
    customer_id bigint,
    product_id bigint,
    old_price numeric(12,2),
    new_price numeric(12,2),
    reason text,
    changed_by bigint,
    action text NOT NULL,
    source text DEFAULT 'trigger'::text NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pricing_history_action_check CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE public.pricing_history OWNER TO postgres;

--
-- Name: pricing_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.pricing_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pricing_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    tenant_id bigint,
    name text NOT NULL,
    category public.product_category_enum DEFAULT 'standard'::public.product_category_enum NOT NULL,
    base_price public.pk_money_dom NOT NULL,
    min_price public.pk_money_dom,
    max_price public.pk_money_dom,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_product_price_bounds CHECK ((((min_price IS NULL) OR (max_price IS NULL) OR ((min_price)::numeric <= (max_price)::numeric)) AND ((min_price IS NULL) OR ((base_price)::numeric >= (min_price)::numeric)) AND ((max_price IS NULL) OR ((base_price)::numeric <= (max_price)::numeric)))),
    CONSTRAINT products_base_price_check CHECK (((base_price)::numeric > (0)::numeric))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.products ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rider_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rider_activities (
    id bigint NOT NULL,
    tenant_id bigint,
    activity_date date NOT NULL,
    employee_id bigint NOT NULL,
    empty_bottles_received integer DEFAULT 0 NOT NULL,
    filled_bottles_sent integer DEFAULT 0 NOT NULL,
    filled_product_bought_back integer DEFAULT 0 NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rider_activities_empty_bottles_received_check CHECK ((empty_bottles_received >= 0)),
    CONSTRAINT rider_activities_filled_bottles_sent_check CHECK ((filled_bottles_sent >= 0)),
    CONSTRAINT rider_activities_filled_product_bought_back_check CHECK ((filled_product_bought_back >= 0))
);


ALTER TABLE public.rider_activities OWNER TO postgres;

--
-- Name: rider_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.rider_activities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rider_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sell_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sell_orders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sell_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_advances_legacy; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_advances_legacy AS
 SELECT a.id,
    a.person_kind AS "personKind",
    a.person_name AS "personName",
    a.advance_date AS "advanceDate",
    a.amount,
    a.notes,
    a.tenant_id AS "tenantId",
    a.created_at AS "createdAt"
   FROM public.advances_legacy a;


ALTER TABLE public.v_advances_legacy OWNER TO postgres;

--
-- Name: v_customer_advances_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_customer_advances_api AS
 SELECT ca.id,
    ca.customer_id AS "customerId",
    c.name AS "customerName",
    ca.advance_date AS "advanceDate",
    ca.amount,
    ca.notes,
    ca.is_active AS "isActive",
    ca.tenant_id AS "tenantId",
    ca.created_at AS "createdAt",
    ca.updated_at AS "updatedAt"
   FROM (public.customer_advances ca
     JOIN public.customers c ON ((c.id = ca.customer_id)));


ALTER TABLE public.v_customer_advances_api OWNER TO postgres;

--
-- Name: v_customer_ledgers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_customer_ledgers AS
 SELECT c.id AS "customerId",
    c.name AS "customerName",
    (COALESCE(sum((ca.amount)::numeric), (0)::numeric))::numeric(12,2) AS "totalAdvances",
    (COALESCE(sum((so.total_amount)::numeric), (0)::numeric))::numeric(12,2) AS "totalSales",
    ((COALESCE(sum((ca.amount)::numeric), (0)::numeric) - COALESCE(sum((so.total_amount)::numeric), (0)::numeric)))::numeric(12,2) AS remaining,
        CASE
            WHEN ((COALESCE(sum((ca.amount)::numeric), (0)::numeric) - COALESCE(sum((so.total_amount)::numeric), (0)::numeric)) >= (0)::numeric) THEN 'Credit'::text
            ELSE 'Debit'::text
        END AS status
   FROM ((public.customers c
     LEFT JOIN public.customer_advances ca ON (((ca.customer_id = c.id) AND (ca.is_active = true))))
     LEFT JOIN public.sell_orders so ON (((so.customer_id = c.id) AND (so.is_active = true))))
  GROUP BY c.id, c.name;


ALTER TABLE public.v_customer_ledgers OWNER TO postgres;

--
-- Name: v_customer_pricing_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_customer_pricing_api AS
 SELECT cp.id,
    cp.customer_id AS "customerId",
    c.name AS "customerName",
    cp.product_id AS "productId",
    p.name AS "productName",
    cp.custom_price AS "customPrice",
    cp.reason,
    cp.is_active AS "isActive",
    cp.tenant_id AS "tenantId",
    cp.created_at AS "createdAt",
    cp.updated_at AS "updatedAt"
   FROM ((public.customer_pricing cp
     JOIN public.customers c ON ((c.id = cp.customer_id)))
     JOIN public.products p ON ((p.id = cp.product_id)));


ALTER TABLE public.v_customer_pricing_api OWNER TO postgres;

--
-- Name: v_customers_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_customers_api AS
 SELECT c.id,
    c.name,
    c.address,
    c.phone,
    c.cnic,
    c.joining_date AS "joiningDate",
    c.opening_bottles AS "openingBottles",
    c.is_active AS "isActive",
    c.tenant_id AS "tenantId",
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt"
   FROM public.customers c
  WHERE (c.deleted_at IS NULL);


ALTER TABLE public.v_customers_api OWNER TO postgres;

--
-- Name: v_dashboard_metrics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dashboard_metrics AS
 WITH revenue AS (
         SELECT COALESCE(sum((sell_orders.total_amount)::numeric), (0)::numeric) AS revenue
           FROM public.sell_orders
          WHERE (sell_orders.is_active = true)
        ), expenses AS (
         SELECT COALESCE(sum((expenditures.amount)::numeric), (0)::numeric) AS expenses
           FROM public.expenditures
          WHERE (expenditures.is_active = true)
        ), outstanding AS (
         SELECT c.id AS customer_id,
            COALESCE(sum((ca.amount)::numeric), (0)::numeric) AS advances,
            COALESCE(sum((so.total_amount)::numeric), (0)::numeric) AS sales,
            (COALESCE(sum((ca.amount)::numeric), (0)::numeric) - COALESCE(sum((so.total_amount)::numeric), (0)::numeric)) AS remaining
           FROM ((public.customers c
             LEFT JOIN public.customer_advances ca ON (((ca.customer_id = c.id) AND (ca.is_active = true))))
             LEFT JOIN public.sell_orders so ON (((so.customer_id = c.id) AND (so.is_active = true))))
          GROUP BY c.id
        )
 SELECT ( SELECT count(*) AS count
           FROM public.customers
          WHERE (customers.is_active = true)) AS customers_count,
    ( SELECT count(*) AS count
           FROM public.employees
          WHERE (employees.is_active = true)) AS employees_count,
    ( SELECT count(*) AS count
           FROM public.products
          WHERE (products.is_active = true)) AS products_count,
    ( SELECT revenue.revenue
           FROM revenue) AS revenue,
    ( SELECT expenses.expenses
           FROM expenses) AS expenses,
    ( SELECT (revenue.revenue - expenses.expenses)
           FROM revenue,
            expenses) AS net_income,
    ( SELECT COALESCE(sum(outstanding.remaining), (0)::numeric) AS "coalesce"
           FROM outstanding) AS outstanding_total;


ALTER TABLE public.v_dashboard_metrics OWNER TO postgres;

--
-- Name: v_employee_advances_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_employee_advances_api AS
 SELECT ea.id,
    ea.employee_id AS "employeeId",
    e.name AS "employeeName",
    ea.advance_date AS "advanceDate",
    ea.amount,
    ea.notes,
    ea.is_active AS "isActive",
    ea.tenant_id AS "tenantId",
    ea.created_at AS "createdAt",
    ea.updated_at AS "updatedAt"
   FROM (public.employee_advances ea
     JOIN public.employees e ON ((e.id = ea.employee_id)));


ALTER TABLE public.v_employee_advances_api OWNER TO postgres;

--
-- Name: v_employee_ledgers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_employee_ledgers AS
 SELECT e.id AS "employeeId",
    e.name AS "employeeName",
    e.monthly_salary AS salary,
    (COALESCE(sum((ea.amount)::numeric), (0)::numeric))::numeric(12,2) AS "totalAdvances",
    (((e.monthly_salary)::numeric - COALESCE(sum((ea.amount)::numeric), (0)::numeric)))::numeric(12,2) AS remaining,
        CASE
            WHEN (((e.monthly_salary)::numeric - COALESCE(sum((ea.amount)::numeric), (0)::numeric)) >= (0)::numeric) THEN 'Positive'::text
            ELSE 'Deficit'::text
        END AS status
   FROM (public.employees e
     LEFT JOIN public.employee_advances ea ON (((ea.employee_id = e.id) AND (ea.is_active = true))))
  GROUP BY e.id, e.name, e.monthly_salary;


ALTER TABLE public.v_employee_ledgers OWNER TO postgres;

--
-- Name: v_employees_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_employees_api AS
 SELECT e.id,
    e.name,
    e.cnic,
    e.phone,
    e.employee_type AS "employeeType",
    e.monthly_salary AS "monthlySalary",
    e.is_active AS "isActive",
    e.tenant_id AS "tenantId",
    e.created_at AS "createdAt",
    e.updated_at AS "updatedAt"
   FROM public.employees e
  WHERE (e.deleted_at IS NULL);


ALTER TABLE public.v_employees_api OWNER TO postgres;

--
-- Name: v_expenditures_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_expenditures_api AS
 SELECT ex.id,
    ex.expense_date AS "expenseDate",
    ex.category,
    ex.amount,
    ex.description,
    ex.employee_id AS "employeeId",
    e.name AS "employeeName",
    ex.is_active AS "isActive",
    ex.tenant_id AS "tenantId",
    ex.created_at AS "createdAt",
    ex.updated_at AS "updatedAt"
   FROM (public.expenditures ex
     LEFT JOIN public.employees e ON ((e.id = ex.employee_id)));


ALTER TABLE public.v_expenditures_api OWNER TO postgres;

--
-- Name: v_products_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_products_api AS
 SELECT p.id,
    p.name,
    p.category,
    p.base_price AS "basePrice",
    p.min_price AS "minPrice",
    p.max_price AS "maxPrice",
    p.is_active AS "isActive",
    p.tenant_id AS "tenantId",
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt"
   FROM public.products p
  WHERE (p.deleted_at IS NULL);


ALTER TABLE public.v_products_api OWNER TO postgres;

--
-- Name: v_rider_activities_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_rider_activities_api AS
 SELECT ra.id,
    ra.activity_date AS "activityDate",
    ra.employee_id AS "employeeId",
    e.name AS "employeeName",
    ra.empty_bottles_received AS "emptyBottlesReceived",
    ra.filled_bottles_sent AS "filledBottlesSent",
    ra.filled_product_bought_back AS "filledProductBoughtBack",
    ra.notes,
    ra.is_active AS "isActive",
    ra.tenant_id AS "tenantId",
    ra.created_at AS "createdAt",
    ra.updated_at AS "updatedAt"
   FROM (public.rider_activities ra
     JOIN public.employees e ON ((e.id = ra.employee_id)));


ALTER TABLE public.v_rider_activities_api OWNER TO postgres;

--
-- Name: v_rider_ledgers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_rider_ledgers AS
 SELECT r.employee_id AS "employeeId",
    e.name AS "employeeName",
    r.activity_date AS date,
    r.empty_bottles_received AS "emptyBottlesReceived",
    r.filled_bottles_sent AS "filledBottlesSent",
    r.filled_product_bought_back AS "filledProductBoughtBack",
    (r.filled_bottles_sent - r.filled_product_bought_back) AS accountability,
        CASE
            WHEN (r.filled_bottles_sent > 0) THEN round(((((r.filled_bottles_sent - r.filled_product_bought_back))::numeric / (r.filled_bottles_sent)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "efficiencyRate"
   FROM (( SELECT rider_activities.employee_id,
            rider_activities.activity_date,
            sum(rider_activities.empty_bottles_received) AS empty_bottles_received,
            sum(rider_activities.filled_bottles_sent) AS filled_bottles_sent,
            sum(rider_activities.filled_product_bought_back) AS filled_product_bought_back
           FROM public.rider_activities
          WHERE (rider_activities.is_active = true)
          GROUP BY rider_activities.employee_id, rider_activities.activity_date) r
     JOIN public.employees e ON ((e.id = r.employee_id)));


ALTER TABLE public.v_rider_ledgers OWNER TO postgres;

--
-- Name: v_sell_orders_api; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_sell_orders_api AS
 SELECT so.id,
    so.bill_date AS "billDate",
    so.customer_id AS "customerId",
    c.name AS "customerName",
    so.product_id AS "productId",
    p.name AS "productName",
    so.quantity,
    so.bottle_cost AS "bottleCost",
    so.total_amount AS "totalAmount",
    so.salesman_employee_id AS "salesmanEmployeeId",
    se.name AS "salesmanAppointed",
    so.remarks,
    so.is_active AS "isActive",
    so.tenant_id AS "tenantId",
    so.created_at AS "createdAt",
    so.updated_at AS "updatedAt"
   FROM (((public.sell_orders so
     JOIN public.customers c ON ((c.id = so.customer_id)))
     JOIN public.products p ON ((p.id = so.product_id)))
     LEFT JOIN public.employees se ON ((se.id = so.salesman_employee_id)));


ALTER TABLE public.v_sell_orders_api OWNER TO postgres;

--
-- Name: advances_legacy advances_legacy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advances_legacy
    ADD CONSTRAINT advances_legacy_pkey PRIMARY KEY (id);


--
-- Name: customer_advances customer_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_advances
    ADD CONSTRAINT customer_advances_pkey PRIMARY KEY (id);


--
-- Name: customer_pricing customer_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_pricing
    ADD CONSTRAINT customer_pricing_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: employee_advances employee_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_advances
    ADD CONSTRAINT employee_advances_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expenditures expenditures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_pkey PRIMARY KEY (id);


--
-- Name: pricing_history pricing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_history
    ADD CONSTRAINT pricing_history_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: rider_activities rider_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rider_activities
    ADD CONSTRAINT rider_activities_pkey PRIMARY KEY (id);


--
-- Name: sell_orders sell_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sell_orders
    ADD CONSTRAINT sell_orders_pkey PRIMARY KEY (id);


--
-- Name: customer_pricing uq_cust_price; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_pricing
    ADD CONSTRAINT uq_cust_price UNIQUE (customer_id, product_id);


--
-- Name: customer_pricing uq_customer_product; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_pricing
    ADD CONSTRAINT uq_customer_product UNIQUE (customer_id, product_id);


--
-- Name: customers uq_customers_name_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uq_customers_name_per_tenant UNIQUE (tenant_id, name);


--
-- Name: customers uq_customers_tenant_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uq_customers_tenant_name UNIQUE (tenant_id, name);


--
-- Name: employees uq_employees_name_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT uq_employees_name_per_tenant UNIQUE (tenant_id, name);


--
-- Name: employees uq_employees_tenant_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT uq_employees_tenant_name UNIQUE (tenant_id, name);


--
-- Name: products uq_products_name_per_tenant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_name_per_tenant UNIQUE (tenant_id, name);


--
-- Name: products uq_products_tenant_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_tenant_name UNIQUE (tenant_id, name);


--
-- Name: idx_advances_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advances_customer ON public.customer_advances USING btree (customer_id);


--
-- Name: idx_advances_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_advances_employee ON public.employee_advances USING btree (employee_id);


--
-- Name: idx_customer_advances_customer_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_advances_customer_date ON public.customer_advances USING btree (customer_id, advance_date);


--
-- Name: idx_customer_pricing_cust_prod; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_pricing_cust_prod ON public.customer_pricing USING btree (customer_id, product_id);


--
-- Name: idx_customers_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_active ON public.customers USING btree (id) WHERE (is_active = true);


--
-- Name: idx_customers_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_name_trgm ON public.customers USING gin (name public.gin_trgm_ops);


--
-- Name: idx_employee_advances_employee_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_advances_employee_date ON public.employee_advances USING btree (employee_id, advance_date);


--
-- Name: idx_employees_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_active ON public.employees USING btree (id) WHERE (is_active = true);


--
-- Name: idx_expenditures_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenditures_date ON public.expenditures USING btree (expense_date);


--
-- Name: idx_expenditures_date_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenditures_date_category ON public.expenditures USING btree (expense_date, category);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active ON public.products USING btree (id) WHERE (is_active = true);


--
-- Name: idx_rider_activities_emp_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rider_activities_emp_date ON public.rider_activities USING btree (employee_id, activity_date);


--
-- Name: idx_sell_orders_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sell_orders_customer ON public.sell_orders USING btree (customer_id);


--
-- Name: idx_sell_orders_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sell_orders_date ON public.sell_orders USING btree (bill_date);


--
-- Name: idx_sell_orders_date_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sell_orders_date_customer ON public.sell_orders USING btree (bill_date, customer_id);


--
-- Name: idx_sell_orders_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sell_orders_product ON public.sell_orders USING btree (product_id);


--
-- Name: idx_sell_orders_salesman; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sell_orders_salesman ON public.sell_orders USING btree (salesman_employee_id);


--
-- Name: ux_mv_monthly_financials_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_mv_monthly_financials_month ON public.mv_monthly_financials USING btree (month);


--
-- Name: customer_pricing audit_customer_pricing; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_customer_pricing AFTER INSERT OR DELETE OR UPDATE ON public.customer_pricing FOR EACH ROW EXECUTE FUNCTION public.trg_pricing_history_audit();


--
-- Name: customer_advances no_future_customer_advances; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER no_future_customer_advances BEFORE INSERT OR UPDATE ON public.customer_advances FOR EACH ROW EXECUTE FUNCTION public.trg_no_future_date('advance_date');


--
-- Name: employee_advances no_future_employee_advances; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER no_future_employee_advances BEFORE INSERT OR UPDATE ON public.employee_advances FOR EACH ROW EXECUTE FUNCTION public.trg_no_future_date('advance_date');


--
-- Name: expenditures no_future_expenditures; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER no_future_expenditures BEFORE INSERT OR UPDATE ON public.expenditures FOR EACH ROW EXECUTE FUNCTION public.trg_no_future_date('expense_date');


--
-- Name: rider_activities no_future_rider_activities; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER no_future_rider_activities BEFORE INSERT OR UPDATE ON public.rider_activities FOR EACH ROW EXECUTE FUNCTION public.trg_no_future_date('activity_date');


--
-- Name: sell_orders no_future_sell_orders; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER no_future_sell_orders BEFORE INSERT OR UPDATE ON public.sell_orders FOR EACH ROW EXECUTE FUNCTION public.trg_no_future_date('bill_date');


--
-- Name: customer_advances set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customer_advances FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: customer_pricing set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customer_pricing FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: customers set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: employee_advances set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.employee_advances FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: employees set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: expenditures set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenditures FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: products set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: rider_activities set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rider_activities FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: sell_orders set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sell_orders FOR EACH ROW EXECUTE FUNCTION public.util_set_updated_at();


--
-- Name: customer_pricing validate_customer_pricing; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER validate_customer_pricing BEFORE INSERT OR UPDATE ON public.customer_pricing FOR EACH ROW EXECUTE FUNCTION public.trg_validate_customer_pricing();


--
-- Name: sell_orders validate_sell_orders; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER validate_sell_orders BEFORE INSERT OR UPDATE ON public.sell_orders FOR EACH ROW EXECUTE FUNCTION public.trg_sell_orders_validate();


--
-- Name: customer_advances customer_advances_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_advances
    ADD CONSTRAINT customer_advances_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: customer_pricing customer_pricing_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_pricing
    ADD CONSTRAINT customer_pricing_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: customer_pricing customer_pricing_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_pricing
    ADD CONSTRAINT customer_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_advances employee_advances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_advances
    ADD CONSTRAINT employee_advances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenditures expenditures_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pricing_history pricing_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_history
    ADD CONSTRAINT pricing_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.employees(id);


--
-- Name: pricing_history pricing_history_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_history
    ADD CONSTRAINT pricing_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pricing_history pricing_history_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_history
    ADD CONSTRAINT pricing_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rider_activities rider_activities_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rider_activities
    ADD CONSTRAINT rider_activities_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sell_orders sell_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sell_orders
    ADD CONSTRAINT sell_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sell_orders sell_orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sell_orders
    ADD CONSTRAINT sell_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sell_orders sell_orders_salesman_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sell_orders
    ADD CONSTRAINT sell_orders_salesman_employee_id_fkey FOREIGN KEY (salesman_employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers svc_read_any_customers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY svc_read_any_customers ON public.customers FOR SELECT USING (true);


--
-- Name: advances_legacy tenant_rw_advances_legacy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_advances_legacy ON public.advances_legacy USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: customer_advances tenant_rw_customer_advances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_customer_advances ON public.customer_advances USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: customer_pricing tenant_rw_customer_pricing; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_customer_pricing ON public.customer_pricing USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: customers tenant_rw_customers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_customers ON public.customers USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: employee_advances tenant_rw_employee_advances; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_employee_advances ON public.employee_advances USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: employees tenant_rw_employees; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_employees ON public.employees USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: expenditures tenant_rw_expenditures; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_expenditures ON public.expenditures USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: pricing_history tenant_rw_pricing_history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_pricing_history ON public.pricing_history USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: products tenant_rw_products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_products ON public.products USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: rider_activities tenant_rw_rider_activities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_rider_activities ON public.rider_activities USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- Name: sell_orders tenant_rw_sell_orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_rw_sell_orders ON public.sell_orders USING (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id()))) WITH CHECK (((tenant_id IS NULL) OR (tenant_id = public.current_tenant_id())));


--
-- PostgreSQL database dump complete
--

