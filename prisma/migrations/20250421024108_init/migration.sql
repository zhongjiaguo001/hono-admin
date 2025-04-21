-- CreateTable
CREATE TABLE "sys_user" (
    "user_id" SERIAL NOT NULL,
    "dept_id" INTEGER,
    "user_name" TEXT NOT NULL,
    "nick_name" TEXT NOT NULL,
    "user_type" TEXT DEFAULT '00',
    "email" TEXT DEFAULT '',
    "phonenumber" TEXT DEFAULT '',
    "sex" TEXT DEFAULT '0',
    "avatar" TEXT DEFAULT '',
    "password" TEXT NOT NULL,
    "psalt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '0',
    "del_flag" TEXT NOT NULL DEFAULT '0',
    "login_ip" TEXT DEFAULT '',
    "login_date" TIMESTAMP(3),
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "role_key" TEXT NOT NULL,
    "role_sort" INTEGER NOT NULL DEFAULT 0,
    "data_scope" TEXT NOT NULL DEFAULT '1',
    "menu_check_strictly" INTEGER NOT NULL DEFAULT 1,
    "dept_check_strictly" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT '0',
    "del_flag" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "sys_menu" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "path" TEXT,
    "name" TEXT NOT NULL,
    "permission" TEXT,
    "type" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT DEFAULT '',
    "component" TEXT,
    "keep_alive" INTEGER NOT NULL DEFAULT 0,
    "show" INTEGER NOT NULL DEFAULT 1,
    "status" INTEGER NOT NULL DEFAULT 1,
    "is_ext" INTEGER NOT NULL DEFAULT 0,
    "ext_open_mode" INTEGER NOT NULL DEFAULT 1,
    "active_menu" TEXT,
    "query" TEXT,
    "order_no" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_dept" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "ancestors" TEXT DEFAULT '',
    "dept_name" TEXT NOT NULL,
    "order_num" INTEGER NOT NULL DEFAULT 0,
    "leader" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT '0',
    "del_flag" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_dept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_post" (
    "post_id" SERIAL NOT NULL,
    "post_code" TEXT NOT NULL,
    "post_name" TEXT NOT NULL,
    "post_sort" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_post_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "sys_dict_type" (
    "dict_id" SERIAL NOT NULL,
    "dict_name" TEXT NOT NULL,
    "dict_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_dict_type_pkey" PRIMARY KEY ("dict_id")
);

-- CreateTable
CREATE TABLE "sys_dict_data" (
    "dict_code" SERIAL NOT NULL,
    "dict_sort" INTEGER NOT NULL DEFAULT 0,
    "dict_label" TEXT NOT NULL,
    "dict_value" TEXT NOT NULL,
    "dict_type" TEXT NOT NULL,
    "css_class" TEXT,
    "list_class" TEXT,
    "is_default" TEXT NOT NULL DEFAULT 'N',
    "status" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_dict_data_pkey" PRIMARY KEY ("dict_code")
);

-- CreateTable
CREATE TABLE "sys_config" (
    "config_id" SERIAL NOT NULL,
    "config_name" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" TEXT NOT NULL,
    "config_type" TEXT NOT NULL DEFAULT 'N',
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "sys_logininfor" (
    "info_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_name" TEXT NOT NULL DEFAULT '',
    "ipaddr" TEXT NOT NULL DEFAULT '',
    "login_location" TEXT NOT NULL DEFAULT '',
    "browser" TEXT NOT NULL DEFAULT '',
    "os" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '0',
    "msg" TEXT NOT NULL DEFAULT '',
    "login_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_logininfor_pkey" PRIMARY KEY ("info_id")
);

-- CreateTable
CREATE TABLE "sys_oper_log" (
    "oper_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "business_type" INTEGER NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT '',
    "request_method" TEXT NOT NULL DEFAULT '',
    "operator_type" INTEGER NOT NULL DEFAULT 0,
    "oper_name" TEXT NOT NULL DEFAULT '',
    "dept_name" TEXT NOT NULL DEFAULT '',
    "oper_url" TEXT NOT NULL DEFAULT '',
    "oper_ip" TEXT NOT NULL DEFAULT '',
    "oper_location" TEXT NOT NULL DEFAULT '',
    "oper_param" TEXT NOT NULL DEFAULT '',
    "json_result" TEXT NOT NULL DEFAULT '',
    "status" INTEGER NOT NULL DEFAULT 0,
    "error_msg" TEXT NOT NULL DEFAULT '',
    "oper_time" TIMESTAMP(3),
    "cost_time" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER,

    CONSTRAINT "sys_oper_log_pkey" PRIMARY KEY ("oper_id")
);

-- CreateTable
CREATE TABLE "sys_notice" (
    "notice_id" SERIAL NOT NULL,
    "notice_title" TEXT NOT NULL,
    "notice_type" TEXT NOT NULL,
    "notice_content" BYTEA,
    "status" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "sys_notice_pkey" PRIMARY KEY ("notice_id")
);

-- CreateTable
CREATE TABLE "sys_upload" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "sys_role_menu" (
    "role_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_menu_pkey" PRIMARY KEY ("role_id","menu_id")
);

-- CreateTable
CREATE TABLE "sys_role_dept" (
    "role_id" INTEGER NOT NULL,
    "dept_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_dept_pkey" PRIMARY KEY ("role_id","dept_id")
);

-- CreateTable
CREATE TABLE "sys_user_post" (
    "user_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,

    CONSTRAINT "sys_user_post_pkey" PRIMARY KEY ("user_id","post_id")
);

-- CreateTable
CREATE TABLE "ai_session" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "model_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_message" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "file_url" TEXT,
    "mime_type" TEXT,
    "tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_user_name_key" ON "sys_user"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_role_key_key" ON "sys_role"("role_key");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_type_dict_type_key" ON "sys_dict_type"("dict_type");

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_config_key_key" ON "sys_config"("config_key");

-- CreateIndex
CREATE INDEX "idx_login_status" ON "sys_logininfor"("status");

-- CreateIndex
CREATE INDEX "idx_login_time" ON "sys_logininfor"("login_time");

-- CreateIndex
CREATE INDEX "idx_oper_bt" ON "sys_oper_log"("business_type");

-- CreateIndex
CREATE INDEX "idx_oper_status" ON "sys_oper_log"("status");

-- CreateIndex
CREATE INDEX "idx_oper_time" ON "sys_oper_log"("oper_time");

-- AddForeignKey
ALTER TABLE "sys_user" ADD CONSTRAINT "sys_user_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_menu" ADD CONSTRAINT "sys_menu_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sys_menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_dept" ADD CONSTRAINT "sys_dept_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sys_dept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_dict_data" ADD CONSTRAINT "sys_dict_data_dict_type_fkey" FOREIGN KEY ("dict_type") REFERENCES "sys_dict_type"("dict_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_logininfor" ADD CONSTRAINT "sys_logininfor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_oper_log" ADD CONSTRAINT "sys_oper_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_upload" ADD CONSTRAINT "sys_upload_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "sys_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_dept" ADD CONSTRAINT "sys_role_dept_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_dept" ADD CONSTRAINT "sys_role_dept_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_post" ADD CONSTRAINT "sys_user_post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_post" ADD CONSTRAINT "sys_user_post_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "sys_post"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_session" ADD CONSTRAINT "ai_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
